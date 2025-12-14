import React from 'react';

const Features = () => {
    return (
        <section className="py-12 bg-white sm:py-16 lg:py-20 pt-rem-4 pb-rem-4">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">

                {/* Heading */}
                <div className="text-center">
                    <h2 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl xl:text-5xl font-pj">
                        Make every step user-centric
                    </h2>
                    <p className="mt-4 text-base leading-7 text-gray-600 sm:mt-8 font-pj">
                        Your AI assistant adapts to every user’s preferences—voice, language, tone, 
                        and interaction style—ensuring seamless performance with a personalized, intuitive experience.
                    </p>
                </div>

                {/* Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-16">

                    {/* CARD 1 */}
                    <div className="bg-white rounded-2xl shadow-md p-10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="flex justify-center">
                            <svg width="46" height="46" viewBox="46 10 46 46" fill="none">
                                <path d="M45 29V23C45 10.85 35.15 1 23 1C10.85 1 1 10.85 1 23V29" stroke="#161616" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M13 29H1V41C1 43.209 2.791 45 5 45H13V29Z" fill="#D4D4D8" stroke="#161616" strokeWidth="2" />
                                <path d="M45 29H33V45H41C43.209 45 45 43.209 45 41V29Z" fill="#D4D4D8" stroke="#161616" strokeWidth="2" />
                            </svg>
                        </div>

                        <h3 className="mt-8 text-xl font-bold text-gray-900">Voice Interaction</h3>
                        <p className="mt-4 text-gray-600">
                            Orvion listens, understands, and responds with natural conversational speech.
                            Enjoy wake-word activation and hands-free intelligent control.
                        </p>
                    </div>

                    {/* CARD 2 */}
                    <div className="bg-white rounded-2xl shadow-md p-10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="flex justify-center">
                            <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
                                <path d="M27 27H19V45H27V27Z" stroke="#161616" strokeWidth="2" />
                                <path d="M9 37H1V45H9V37Z" fill="#D4D4D8" stroke="#161616" strokeWidth="2" />
                                <path d="M45 17H37V45H45V17Z" fill="#D4D4D8" stroke="#161616" strokeWidth="2" />
                                <path d="M5 17L15 7L23 15L37 1" stroke="#161616" strokeWidth="2" />
                                <path d="M28 1H37V10" stroke="#161616" strokeWidth="2" />
                            </svg>
                        </div>

                        <h3 className="mt-8 text-xl font-bold text-gray-900">Multilingual Capabilities</h3>
                        <p className="mt-4 text-gray-600">
                            Orvion communicates in Hindi, Marathi, Tamil, Telugu, Kannada, English,
                            and more—instantly adapting to the user’s preferred language.
                        </p>
                    </div>

                    {/* CARD 3 */}
                    <div className="bg-white rounded-2xl shadow-md p-10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="flex justify-center">
                            <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                                <path d="M41 1H1V41H41V1Z" stroke="#161616" strokeWidth="2" />
                                <path d="M18 7H7V20H18V7Z" stroke="#161616" strokeWidth="2" />
                                <path d="M18 26H7V35H18V26Z" stroke="#161616" strokeWidth="2" />
                                <path d="M35 7H24V35H35V7Z" fill="#D4D4D8" stroke="#161616" strokeWidth="2" />
                            </svg>
                        </div>

                        <h3 className="mt-8 text-xl font-bold text-gray-900">Smart Web Search</h3>
                        <p className="mt-4 text-gray-600">
                            Searches Google, YouTube, and more—summarizing results into precise,
                            clutter-free answers tailored to the user’s intent.
                        </p>
                    </div>

                    {/* CARD 4 */}
                    <div className="bg-white rounded-2xl shadow-md p-10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="flex justify-center">
                            <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                                <path d="M9 9H33" stroke="#161616" strokeWidth="2" />
                                <path d="M9 17H33" stroke="#161616" strokeWidth="2" />
                                <path d="M1 25H13V31H29V25H41" stroke="#161616" strokeWidth="2" />
                                <path d="M37 1H5C2.79 1 1 2.79 1 5V37C1 39.21 2.79 41 5 41H37C39.21 41 41 39.21 41 37V5C41 2.79 39.21 1 37 1Z" stroke="#161616" strokeWidth="2" />
                            </svg>
                        </div>

                        <h3 className="mt-8 text-xl font-bold text-gray-900">System Control</h3>
                        <p className="mt-4 text-gray-600">
                            Opens apps, executes system commands, manages device settings,
                            and automates workflows in real time.
                        </p>
                    </div>

                    {/* CARD 5 */}
                    <div className="bg-white rounded-2xl shadow-md p-10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="flex justify-center">
                            <svg width="46" height="42" viewBox="0 0 46 42" fill="none">
                                <path d="M30.562 18.4609C30.0511 17.9392 29.4292 17.5392 28.7426 17.2907C28.0559 17.0422 27.3221 16.9516 26.5956 17.0256C25.8692 17.0996 25.1687 17.3362 24.5462 17.718C23.9237 18.0998 23.3952 18.6169 23 19.2309C22.6049 18.6167 22.0764 18.0995 21.4539 17.7176C20.8315 17.3357 20.1309 17.099 19.4044 17.025C18.6779 16.951 17.944 17.0417 17.2573 17.2903C16.5706 17.5389 15.9488 17.939 15.438 18.4609C14.5163 19.4035 14.0002 20.6695 14.0002 21.9879C14.0002 23.3063 14.5163 24.5722 15.438 25.5149L23 33.1999L30.564 25.5159C31.485 24.5726 32.0004 23.3064 32 21.988C31.9997 20.6696 31.4835 19.4037 30.562 18.4609Z" fill="#D4D4D8" stroke="#161616" strokeWidth="2" />
                                <path d="M41 41H5C3.94 41 2.92 40.58 2.17 39.83C1.42 39.08 1 38.06 1 37V1H17L22 9H45V37C45 38.06 44.58 39.08 43.83 39.83C43.08 40.58 42.06 41 41 41Z" stroke="#161616" strokeWidth="2" />
                            </svg>
                        </div>

                        <h3 className="mt-8 text-xl font-bold text-gray-900">Messaging Automation</h3>
                        <p className="mt-4 text-gray-600">
                            Send WhatsApp and Instagram messages using voice.
                            Orvion handles formatting, contact selection,
                            and delivery confirmation automatically.
                        </p>
                    </div>

                    {/* CARD 6 */}
                    <div className="bg-white rounded-2xl shadow-md p-10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="flex justify-center">
                            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                                <path d="M25 7C34.941 7 43 15.059 43 25C43 34.941 34.941 43 25 43C15.059 43 7 34.941 7 25" stroke="#161616" strokeWidth="2" />
                                <path d="M19 1C9.059 1 1 9.059 1 19H19V1Z" fill="#D4D4D8" stroke="#161616" strokeWidth="2" />
                            </svg>
                        </div>

                        <h3 className="mt-8 text-xl font-bold text-gray-900">Android TV / Chromecast Control</h3>
                        <p className="mt-4 text-gray-600">
                            Control power, volume, apps, and navigation on Android TV devices
                            using natural voice commands through your React interface.
                        </p>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Features;
