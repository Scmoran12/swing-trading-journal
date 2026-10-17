// A missing test setup must never fall back to inherited personal DB credentials.
export function requireDesktopSettings(settings,testMode){
 if(!settings)throw new Error('LOCAL_SETUP_REQUIRED');
 let names;try{names=['DATABASE_URL','APP_DATABASE_URL','AUTH_DATABASE_URL'].map(key=>new URL(settings[key]).pathname);}catch{throw new Error('LOCAL_SETUP_REQUIRED');}
 if(new Set(names).size!==1)throw new Error('DESKTOP_DATABASE_MISMATCH');
 if(testMode&&!/^\/swingpilot_test_[a-z0-9_]+$/.test(names[0]))throw new Error('ISOLATED_TEST_DATABASE_REQUIRED');
}
