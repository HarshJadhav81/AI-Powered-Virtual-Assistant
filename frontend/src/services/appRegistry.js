/**
 * Universal App Registry
 * Defines supported applications, their sections, and execution strategies per platform.
 * strictly adheres to the Universal App Control Engine schema.
 */

export const AppRegistry = {
    youtube: {
        appName: 'YouTube',
        platforms: ['windows', 'mac', 'linux', 'android', 'ios', 'web', 'tv'],
        openMethods: {
            system: {
                android: 'vnd.youtube://',
                ios: 'youtube://'
            },
            web: 'https://www.youtube.com'
        },
        sections: [
            // PRIMARY SECTIONS
            {
                name: 'home',
                voiceTriggers: ['home', 'main feed', 'feed'],
                systemAction: { android: 'vnd.youtube://', ios: 'youtube://' },
                webFallback: 'https://www.youtube.com',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: true },
                confirmationRequired: false
            },
            {
                name: 'shorts',
                voiceTriggers: ['shorts', 'short videos', 'reels'],
                systemAction: { android: 'vnd.youtube://shorts', ios: 'youtube://shorts' },
                webFallback: 'https://www.youtube.com/shorts',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'subscriptions',
                voiceTriggers: ['subscriptions', 'subs', 'my channels'],
                systemAction: { android: 'vnd.youtube://subscriptions', ios: 'youtube://subscriptions' },
                webFallback: 'https://www.youtube.com/feed/subscriptions',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: true },
                confirmationRequired: false
            },
            {
                name: 'library',
                voiceTriggers: ['library', 'you', 'my library'],
                systemAction: { android: 'vnd.youtube://library', ios: 'youtube://library' },
                webFallback: 'https://www.youtube.com/feed/library',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: true },
                confirmationRequired: false
            },
            // YOU SECTION
            {
                name: 'history',
                voiceTriggers: ['history', 'watch history'],
                systemAction: null,
                webFallback: 'https://www.youtube.com/feed/history',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'watch_later',
                voiceTriggers: ['watch later', 'saved videos'],
                systemAction: { android: 'vnd.youtube://playlist?list=WL', ios: 'youtube://playlist?list=WL' },
                webFallback: 'https://www.youtube.com/playlist?list=WL',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: true },
                confirmationRequired: false
            },
            {
                name: 'liked_videos',
                voiceTriggers: ['liked videos', 'my likes'],
                systemAction: { android: 'vnd.youtube://playlist?list=LL', ios: 'youtube://playlist?list=LL' },
                webFallback: 'https://www.youtube.com/playlist?list=LL',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: true },
                confirmationRequired: false
            },
            {
                name: 'playlists',
                voiceTriggers: ['playlists', 'my playlists'],
                systemAction: null,
                webFallback: 'https://www.youtube.com/feed/playlists',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'your_channel',
                voiceTriggers: ['my channel', 'your channel', 'profile'],
                systemAction: null,
                webFallback: 'https://www.youtube.com/channel/',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            // DISCOVERY
            {
                name: 'search',
                voiceTriggers: ['search', 'find'],
                systemAction: { android: 'vnd.youtube://results?search_query={{query}}', ios: 'youtube://results?search_query={{query}}' },
                webFallback: 'https://www.youtube.com/results?search_query={{query}}',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: true },
                confirmationRequired: false
            },
            {
                name: 'trending',
                voiceTriggers: ['trending', 'popular'],
                systemAction: { android: 'vnd.youtube://trending', ios: 'youtube://trending' },
                webFallback: 'https://www.youtube.com/feed/trending',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: true },
                confirmationRequired: false
            },
            // SETTINGS
            {
                name: 'settings',
                voiceTriggers: ['settings', 'config'],
                systemAction: null,
                webFallback: 'https://www.youtube.com/account',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            // CREATOR (Web Only)
            {
                name: 'studio',
                voiceTriggers: ['studio', 'dashboard', 'analytics', 'content'],
                systemAction: null,
                webFallback: 'https://studio.youtube.com/',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            }
        ]
    },
    instagram: {
        appName: 'Instagram',
        platforms: ['android', 'ios', 'web'],
        openMethods: {
            system: {
                android: 'instagram://app',
                ios: 'instagram://app'
            },
            web: 'https://www.instagram.com'
        },
        sections: [
            {
                name: 'home',
                voiceTriggers: ['home', 'feed'],
                systemAction: { android: 'instagram://app', ios: 'instagram://app' },
                webFallback: 'https://www.instagram.com',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'messages',
                voiceTriggers: ['messages', 'dm', 'inbox', 'chats', 'direct'],
                systemAction: { android: 'instagram://direct_inbox', ios: 'instagram://direct_inbox' },
                webFallback: 'https://www.instagram.com/direct/inbox/',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'camera',
                voiceTriggers: ['camera', 'story camera', 'create story'],
                systemAction: { android: 'instagram://camera', ios: 'instagram://camera' },
                webFallback: null,
                availability: { windows: false, mac: false, android: true, ios: true, web: false, tv: false },
                confirmationRequired: false
            },
            {
                name: 'profile',
                voiceTriggers: ['profile', 'my profile'],
                systemAction: { android: 'instagram://user?username={{username}}', ios: 'instagram://user?username={{username}}' },
                webFallback: 'https://www.instagram.com/{{username}}/',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'reels',
                voiceTriggers: ['reels', 'short videos'],
                systemAction: null,
                webFallback: 'https://www.instagram.com/reels/',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'explore',
                voiceTriggers: ['explore', 'discover', 'search'],
                systemAction: { android: 'instagram://share', ios: 'instagram://share' }, // Sometimes maps to explore
                webFallback: 'https://www.instagram.com/explore/',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'saved',
                voiceTriggers: ['saved', 'saved posts', 'bookmarks'],
                systemAction: null,
                webFallback: 'https://www.instagram.com/{{username}}/saved/',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'settings',
                voiceTriggers: ['settings', 'config'],
                systemAction: null,
                webFallback: 'https://www.instagram.com/accounts/edit/',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            }
        ]
    },
    whatsapp: {
        appName: 'WhatsApp',
        platforms: ['android', 'ios', 'web', 'windows', 'mac'],
        openMethods: {
            system: {
                android: 'whatsapp://',
                ios: 'whatsapp://',
                windows: 'whatsapp://',
                mac: 'whatsapp://'
            },
            web: 'https://web.whatsapp.com'
        },
        sections: [
            {
                name: 'home',
                voiceTriggers: ['home', 'chats'],
                systemAction: { android: 'whatsapp://', ios: 'whatsapp://' },
                webFallback: 'https://web.whatsapp.com',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'send',
                voiceTriggers: ['send message', 'chat with'],
                systemAction: { android: 'whatsapp://send?phone={{phone}}&text={{text}}', ios: 'whatsapp://send?phone={{phone}}&text={{text}}' },
                webFallback: 'https://web.whatsapp.com/send?phone={{phone}}&text={{text}}',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: false },
                confirmationRequired: true // SENSITIVE
            },
            {
                name: 'status',
                voiceTriggers: ['status', 'stories'],
                systemAction: null,
                webFallback: null, // Web doesn't deeply link to status nicely
                availability: { windows: false, mac: false, android: true, ios: true, web: false, tv: false },
                confirmationRequired: false
            },
            {
                name: 'calls',
                voiceTriggers: ['calls', 'call history'],
                systemAction: null,
                webFallback: null,
                availability: { windows: false, mac: false, android: true, ios: true, web: false, tv: false },
                confirmationRequired: false
            },
            {
                name: 'settings',
                voiceTriggers: ['settings'],
                systemAction: null,
                webFallback: null,
                availability: { windows: false, mac: false, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            }
        ]
    },
    browser: {
        appName: 'Chrome', // Default Browser
        platforms: ['windows', 'mac', 'linux', 'android', 'ios'],
        openMethods: {
            system: {
                android: 'googlechrome://',
                ios: 'googlechrome://',
                windows: 'chrome',
                mac: 'Google Chrome'
            },
            web: 'https://www.google.com'
        },
        sections: [
            {
                name: 'new_tab',
                voiceTriggers: ['new tab', 'home'],
                systemAction: { android: 'googlechrome://navigate?url=about:blank', ios: 'googlechrome://' },
                webFallback: 'https://www.google.com',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'downloads',
                voiceTriggers: ['downloads', 'download history'],
                systemAction: null,
                webFallback: 'chrome://downloads',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'history',
                voiceTriggers: ['history', 'browsing history'],
                systemAction: null,
                webFallback: 'chrome://history',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'bookmarks',
                voiceTriggers: ['bookmarks', 'favorites'],
                systemAction: null,
                webFallback: 'chrome://bookmarks',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'settings',
                voiceTriggers: ['settings'],
                systemAction: null,
                webFallback: 'chrome://settings',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'incognito',
                voiceTriggers: ['incognito', 'private'],
                systemAction: null, // Hard to launch directly via generic logic
                webFallback: null,
                availability: { windows: false, mac: false, android: false, ios: false, web: false, tv: false },
                confirmationRequired: false
            },
            {
                name: 'search',
                voiceTriggers: ['search', 'find'],
                systemAction: { android: 'googlechrome://navigate?url={{query}}', ios: 'googlechrome://navigate?url={{query}}' },
                webFallback: 'https://www.google.com/search?q={{query}}',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: true },
                confirmationRequired: false
            }
        ]
    },
    mail: {
        appName: 'Mail',
        platforms: ['windows', 'mac', 'android', 'ios', 'web'],
        openMethods: {
            system: {
                android: 'googlegmail://',
                ios: 'googlegmail://'
            },
            web: 'https://mail.google.com'
        },
        sections: [
            {
                name: 'inbox',
                voiceTriggers: ['inbox', 'emails'],
                systemAction: { android: 'googlegmail://', ios: 'googlegmail://' },
                webFallback: 'https://mail.google.com/mail/u/0/#inbox',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'sent',
                voiceTriggers: ['sent', 'sent items'],
                systemAction: null,
                webFallback: 'https://mail.google.com/mail/u/0/#sent',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'drafts',
                voiceTriggers: ['drafts'],
                systemAction: null,
                webFallback: 'https://mail.google.com/mail/u/0/#drafts',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'starred',
                voiceTriggers: ['starred', 'important'],
                systemAction: null,
                webFallback: 'https://mail.google.com/mail/u/0/#starred',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'trash',
                voiceTriggers: ['trash', 'bin', 'deleted'],
                systemAction: null,
                webFallback: 'https://mail.google.com/mail/u/0/#trash',
                availability: { windows: true, mac: true, android: false, ios: false, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'compose',
                voiceTriggers: ['compose', 'new email', 'write email'],
                systemAction: { android: 'mailto:', ios: 'mailto:' },
                webFallback: 'https://mail.google.com/mail/u/0/#inbox?compose=new',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: false },
                confirmationRequired: true // SENSITIVE
            },
            {
                name: 'search',
                voiceTriggers: ['search', 'find'],
                systemAction: null,
                webFallback: 'https://mail.google.com/mail/u/0/#search/{{query}}',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: false },
                confirmationRequired: false
            }
        ]
    },
    // SYSTEM APPS
    settings: {
        appName: 'Settings',
        platforms: ['windows', 'mac', 'android', 'ios'],
        openMethods: {
            system: {
                windows: 'ms-settings:',
                mac: 'x-apple.systempreferences:',
                android: 'android.settings.SETTINGS',
                ios: 'App-Prefs:root'
            },
            web: null
        },
        sections: [
            {
                name: 'home',
                voiceTriggers: ['home', 'general'],
                systemAction: {
                    windows: 'ms-settings:', mac: 'x-apple.systempreferences:', android: 'android.settings.SETTINGS', ios: 'App-Prefs:root'
                },
                webFallback: null,
                availability: { windows: true, mac: true, android: true, ios: true, web: false, tv: true },
                confirmationRequired: false
            },
            {
                name: 'wifi',
                voiceTriggers: ['wifi', 'network', 'internet'],
                systemAction: {
                    windows: 'ms-settings:network-wifi', mac: 'x-apple.systempreferences:com.apple.preference.network', android: 'android.settings.WIFI_SETTINGS', ios: 'App-Prefs:root=WIFI'
                },
                webFallback: null,
                availability: { windows: true, mac: true, android: true, ios: true, web: false, tv: true },
                confirmationRequired: false
            },
            {
                name: 'bluetooth',
                voiceTriggers: ['bluetooth', 'devices'],
                systemAction: {
                    windows: 'ms-settings:bluetooth', mac: 'x-apple.systempreferences:com.apple.preferences.Bluetooth', android: 'android.settings.BLUETOOTH_SETTINGS', ios: 'App-Prefs:root=Bluetooth'
                },
                webFallback: null,
                availability: { windows: true, mac: true, android: true, ios: true, web: false, tv: true },
                confirmationRequired: false
            }
        ]
    },
    photos: {
        appName: 'Photos',
        platforms: ['windows', 'mac', 'android', 'ios'],
        openMethods: {
            system: {
                windows: 'ms-photos:',
                mac: 'photos://', // Informal
                android: 'content://media/internal/images/media',
                ios: 'photos-redirect://'
            },
            web: 'https://photos.google.com'
        },
        sections: [
            {
                name: 'home',
                voiceTriggers: ['home', 'gallery', 'all photos'],
                systemAction: { android: 'content://media/internal/images/media', ios: 'photos-redirect://' },
                webFallback: 'https://photos.google.com',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: true },
                confirmationRequired: false
            }
        ]
    },
    files: {
        appName: 'File Manager',
        platforms: ['windows', 'mac', 'android', 'ios'],
        openMethods: {
            system: {
                windows: 'explorer',
                mac: 'open .', // Will open Finder in home
                android: 'content://com.android.externalstorage.documents/root/primary',
                ios: 'shareddocuments://'
            },
            web: 'https://drive.google.com' // Fallback
        },
        sections: [
            {
                name: 'home',
                voiceTriggers: ['home', 'files', 'explorer'],
                systemAction: null,
                webFallback: 'https://drive.google.com',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: false },
                confirmationRequired: false
            }
        ]
    },
    camera: {
        appName: 'Camera',
        platforms: ['windows', 'mac', 'android', 'ios'],
        openMethods: {
            system: {
                windows: 'microsoft.windows.camera:',
                android: 'android.media.action.IMAGE_CAPTURE', // This is usually an action, not navigate
                ios: 'camera://' // Restricted
            },
            web: null
        },
        sections: [
            {
                name: 'take_photo',
                voiceTriggers: ['photo', 'picture'],
                systemAction: { android: 'android.media.action.IMAGE_CAPTURE' },
                webFallback: null,
                availability: { windows: true, mac: false, android: true, ios: false, web: false, tv: false },
                confirmationRequired: false
            }
        ]
    },
    music: {
        appName: 'Music',
        platforms: ['windows', 'mac', 'android', 'ios', 'web'],
        openMethods: {
            system: {
                windows: 'mswindowsmusic:',
                mac: 'music://',
                android: 'android.intent.action.MUSIC_PLAYER',
                ios: 'music://'
            },
            web: 'https://music.youtube.com' // Reasonable fallback
        },
        sections: [
            {
                name: 'home',
                voiceTriggers: ['home', 'music', 'player'],
                systemAction: { android: 'android.intent.action.MUSIC_PLAYER', ios: 'music://' },
                webFallback: 'https://music.youtube.com',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: true },
                confirmationRequired: false
            }
        ]
    },
    store: {
        appName: 'App Store',
        platforms: ['windows', 'mac', 'android', 'ios', 'web'],
        openMethods: {
            system: {
                windows: 'ms-windows-store:',
                mac: 'macappstore:',
                android: 'market://',
                ios: 'itms-apps://'
            },
            web: 'https://play.google.com/store'
        },
        sections: [
            {
                name: 'home',
                voiceTriggers: ['home', 'store', 'app store', 'play store', 'market'],
                systemAction: {
                    windows: 'ms-windows-store://home',
                    mac: 'macappstore://',
                    android: 'market://details?id=com.android.vending',
                    ios: 'itms-apps://'
                },
                webFallback: 'https://play.google.com/store/apps',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: true },
                confirmationRequired: false
            },
            {
                name: 'search',
                voiceTriggers: ['search', 'find app'],
                systemAction: {
                    windows: 'ms-windows-store://search/?query={{query}}',
                    mac: 'macappstore://search?q={{query}}',
                    android: 'market://search?q={{query}}',
                    ios: 'itms-apps://search.itunes.apple.com/WebObjects/MZSearch.woa/wa/search?media=software&term={{query}}'
                },
                webFallback: 'https://play.google.com/store/search?q={{query}}',
                availability: { windows: true, mac: true, android: true, ios: true, web: true, tv: false },
                confirmationRequired: false
            },
            {
                name: 'updates',
                voiceTriggers: ['updates', 'app updates'],
                systemAction: {
                    windows: 'ms-windows-store://downloadsandupdates',
                    mac: 'macappstore://updates',
                    android: 'market://myapps',
                    ios: 'itms-apps://updates' // Approximate
                },
                webFallback: 'https://play.google.com/store/apps',
                availability: { windows: true, mac: true, android: true, ios: true, web: false, tv: false },
                confirmationRequired: false
            }
        ]
    }
};

/**
 * Helper to retrieve app config
 */
export const getAppConfig = (appName) => {
    const normalized = appName.toLowerCase().trim();
    for (const key in AppRegistry) {
        const app = AppRegistry[key];
        // Check App Name
        if (app.appName.toLowerCase() === normalized) return app;

        // Check Key
        if (key === normalized) return app;
    }
    return null;
};

export default AppRegistry;
