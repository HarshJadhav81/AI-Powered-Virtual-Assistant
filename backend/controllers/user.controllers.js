 import uploadOnCloudinary from "../config/cloudinary.js"
import geminiResponse from "../gemini.js"
import User from "../models/user.model.js"
import Conversation from "../models/conversation.model.js"
import moment from "moment"
 export const getCurrentUser=async (req,res)=>{
    try {
        const userId=req.userId
        const user=await User.findById(userId).select("-password")
        if(!user){
return res.status(400).json({message:"user not found"})
        }

   return res.status(200).json(user)     
    } catch (error) {
       return res.status(400).json({message:"get current user error"}) 
    }
}

export const updateAssistant = async (req, res) => {
   try {
      const { assistantName, imageUrl } = req.body;
      
      if (!assistantName) {
         return res.status(400).json({ 
            success: false,
            message: "Assistant name is required" 
         });
      }

      let assistantImage;
      if (req.file) {
         // Upload new image to Cloudinary if file is provided
         assistantImage = await uploadOnCloudinary(req.file.path);
         if (!assistantImage) {
            return res.status(400).json({ 
               success: false,
               message: "Image upload failed" 
            });
         }
      } else if (imageUrl) {
         // Use provided image URL if no file is uploaded
         assistantImage = imageUrl;
      }

      // Update user with new assistant details
      const user = await User.findByIdAndUpdate(
         req.userId,
         {
            assistantName: assistantName.trim(),
            ...(assistantImage && { assistantImage }) // Only update image if provided
         },
         { 
            new: true,
            runValidators: true
         }
      ).select("-password");

      if (!user) {
         return res.status(404).json({ 
            success: false,
            message: "User not found" 
         });
      }

      return res.status(200).json({
         success: true,
         message: "Assistant updated successfully",
         user
      });

   } catch (error) {
      console.error("Update Assistant Error:", error);
      return res.status(500).json({ 
         success: false,
         message: error.message || "Failed to update assistant"
      });
   }
}


export const askToAssistant=async (req,res)=>{
   try {
      const {command}=req.body
      const user=await User.findById(req.userId);
      user.history.push(command)
      user.save()
      const userName=user.name
      const assistantName=user.assistantName
      const result=await geminiResponse(command,assistantName,userName)

      const jsonMatch=result.match(/{[\s\S]*}/)
      if(!jsonMatch){
         return res.status(400).json({response:"sorry, i can't understand"})
      }
      const gemResult=JSON.parse(jsonMatch[0])
      console.log(gemResult)
      const type=gemResult.type

      switch(type){
         case 'get-date' :
            return res.json({
               type,
               userInput:gemResult.userInput,
               response:`current date is ${moment().format("YYYY-MM-DD")}`
            });
            case 'get-time':
                return res.json({
               type,
               userInput:gemResult.userInput,
               response:`current time is ${moment().format("hh:mm A")}`
            });
             case 'get-day':
                return res.json({
               type,
               userInput:gemResult.userInput,
               response:`today is ${moment().format("dddd")}`
            });
            case 'get-month':
                return res.json({
               type,
               userInput:gemResult.userInput,
               response:`today is ${moment().format("MMMM")}`
            });
      case 'google-search':
      case 'youtube-search':
      case 'youtube-play':
      case 'general':
      case  "calculator-open":
      case "instagram-open": 
       case "facebook-open": 
       case "weather-show" :
         return res.json({
            type,
            userInput:gemResult.userInput,
            response:gemResult.response,
         });

         default:
            return res.status(400).json({ response: "I didn't understand that command." })
      }
     

   } catch (error) {
  return res.status(500).json({ response: "ask assistant error" })
   }
}

/**
 * Get conversation history for authenticated user
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 10;

    const conversations = await Conversation.find({ userId, isActive: true })
      .sort({ lastInteraction: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations'
    });
  }
};

/**
 * Delete all conversations for authenticated user
 */
export const deleteConversations = async (req, res) => {
  try {
    const userId = req.userId;

    await Conversation.updateMany(
      { userId },
      { isActive: false }
    );

    return res.status(200).json({
      success: true,
      message: 'All conversations cleared'
    });
  } catch (error) {
    console.error('Delete conversations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear conversations'
    });
  }
};

/**
 * Delete a specific conversation session
 */
export const deleteConversationSession = async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    const result = await Conversation.updateOne(
      { userId, sessionId },
      { isActive: false }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete conversation'
    });
  }
};