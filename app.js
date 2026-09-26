/**
 * SAKSHYA Client-Side Application Logic (ES6+)
 * Handles Authentication, MFA simulation, Evidence Hashing, RBAC State,
 * Source Workspace, file copying and project export.
 */

const appState = {
    currentView: 'live',
    selectedCodeFile: 'index.html',
    authStep: 'login',
    selectedRole: 'police',
    userEmail: 'officer.smith@policedept.gov',
    selectedMFA: 'passkey',
    generatedHash: null,
    auditLogs: [
        { id: 'LOG-1029', event: 'OIDC Identity Token Requested', time: '10:34:12 UTC', hash: '0x49a...81e' },
        { id: 'LOG-1030', event: 'HSM Public Key Assertion Verified', time: '10:34:14 UTC', hash: '0x81b...f02' }
    ]
};

const ROLES_MAP = [
    { id: 'public', name: 'Public', icon: 'fa-users', color: 'text-slate-400' },
    { id: 'police', name: 'Police', icon: 'fa-user-shield', color: 'text-cyan-400' },
    { id: 'investigator', name: 'Investigator', icon: 'fa-magnifying-glass', color: 'text-blue-400' },
    { id: 'lawyer', name: 'Lawyer', icon: 'fa-scale-balanced', color: 'text-purple-400' },
    { id: 'custodian', name: 'Evidence Custodian', icon: 'fa-box-archive', color: 'text-amber-400' },
    { id: 'supervisor', name: 'Supervisor', icon: 'fa-user-tie', color: 'text-emerald-400' },
    { id: 'auditor', name: 'Auditor / Court', icon: 'fa-gavel', color: 'text-rose-400' },
    { id: 'admin', name: 'System Admin', icon: 'fa-sliders', color: 'text-indigo-400' }
];

function renderLiveStage() {
    const stage = document.getElementById('live-stage');
    if (!stage) return;

    if (appState.authStep === 'login') {
        stage.innerHTML = `
            <div class="max-w-2xl mx-auto glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800">
                <div class="text-center mb-6">
                    <span class="bg-brand-500/10 text-brand-400 text-[11px] font-mono px-3 py-1 rounded-full border border-brand-500/30 uppercase tracking-widest">
                        STEP 1: IDENTITY PROVIDER (OIDC)
                    </span>
                    <h2 class="text-2xl font-extrabold text-white mt-2">Sign In to SAKSHYA Portal</h2>
                    <p class="text-xs text-slate-400 mt-1">Select your designated authorization category to proceed</p>
                </div>

                <div class="mb-6">
                    <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Select User Role</label>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        ${ROLES_MAP.map(r => `
                            <button onclick="setRole('${r.id}')" class="p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${appState.selectedRole === r.id ? 'bg-brand-500/15 border-brand-500 text-white shadow-lg shadow-brand-500/10' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'}">
                                <i class="fa-solid ${r.icon} ${r.color} text-lg"></i>
                                <span class="text-xs font-medium">${r.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <form onsubmit="handleLoginSubmit(event)" class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1">Institutional Email / Badge ID</label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs"><i class="fa-solid fa-envelope"></i></span>
                            <input type="email" id="input-email" required value="${appState.userEmail}" class="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition">
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-300 mb-1">Secure Passphrase / Private Key Keyring</label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs"><i class="fa-solid fa-lock"></i></span>
                            <input type="password" required value="••••••••••••••••" class="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition">
                        </div>
                    </div>

                    <button type="submit" class="w-full py-3 bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition flex items-center justify-center space-x-2">
                        <span>Verify Credentials &amp; Request MFA Challenge</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </form>
            </div>
        `;
    } else if (appState.authStep === 'mfa') {
        stage.innerHTML = `
            <div class="max-w-xl mx-auto glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-800">
                <div class="text-center mb-6">
                    <span class="bg-blue-500/10 text-blue-400 text-[11px] font-mono px-3 py-1 rounded-full border border-blue-500/30 uppercase tracking-widest">
                        STEP 2: HARDWARE MFA &amp; DEVICE INTEGRITY
                    </span>
                    <h2 class="text-2xl font-extrabold text-white mt-2">Multi-Factor Authentication</h2>
                    <p class="text-xs text-slate-400 mt-1">Role Authenticating: <span class="text-brand-400 font-bold uppercase">${appState.selectedRole}</span></p>
                </div>

                <div class="space-y-3 mb-6">
                    <button onclick="setMFAMethod('passkey')" class="w-full p-4 rounded-xl border text-left transition flex items-center justify-between ${appState.selectedMFA === 'passkey' ? 'bg-blue-500/15 border-blue-500 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400'}">
                        <div class="flex items-center space-x-3">
                            <i class="fa-solid fa-key text-brand-400 text-lg"></i>
                            <div><p class="text-xs font-bold">Passkeys / WebAuthn (FIDO2)</p><p class="text-[11px] text-slate-400">Hardware token or biometric passkey</p></div>
                        </div>
                        <span class="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">NIST L3</span>
                    </button>

                    <button onclick="setMFAMethod('totp')" class="w-full p-4 rounded-xl border text-left transition flex items-center justify-between ${appState.selectedMFA === 'totp' ? 'bg-blue-500/15 border-blue-500 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400'}">
                        <div class="flex items-center space-x-3">
                            <i class="fa-solid fa-mobile-screen-button text-blue-400 text-lg"></i>
                            <div><p class="text-xs font-bold">TOTP Authenticator App</p><p class="text-[11px] text-slate-400">Time-based 6-digit dynamic token</p></div>
                        </div>
                    </button>

                    <button onclick="setMFAMethod('sms')" class="w-full p-4 rounded-xl border text-left transition flex items-center justify-between ${appState.selectedMFA === 'sms' ? 'bg-blue-500/15 border-blue-500 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400'}">
                        <div class="flex items-center space-x-3">
                            <i class="fa-solid fa-comment-sms text-amber-400 text-lg"></i>
                            <div><p class="text-xs font-bold">SMS OTP Fallback</p><p class="text-[11px] text-slate-400">Secondary fallback SMS authentication</p></div>
                        </div>
                    </button>
                </div>

                <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-6 font-mono text-[11px] space-y-1 text-slate-400">
                    <div class="flex justify-between"><span>Device Hardware ID:</span><span class="text-emerald-400">0x8F2A-9C01-KMS</span></div>
                    <div class="flex justify-between"><span>TPM 2.0 State:</span><span class="text-emerald-400">SECURE_BOOT_VERIFIED</span></div>
                </div>

                <div class="flex space-x-3">
                    <button onclick="setAuthStep('login')" class="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition">Back</button>
                    <button onclick="simulateMFAPass()" class="w-2/3 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2">
                        <i class="fa-solid fa-fingerprint"></i><span>Authorize WebAuthn Token</span>
                    </button>
                </div>
            </div>
        `;
    } else if (appState.authStep === 'dashboard') {
        const role = ROLES_MAP.find(r => r.id === appState.selectedRole) || ROLES_MAP[1];

        stage.innerHTML = `
            <div class="space-y-6">
                <div class="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 text-xl font-bold">
                            <i class="fa-solid ${role.icon}"></i>
                        </div>
                        <div>
                            <div class="flex items-center space-x-2">
                                <h2 class="text-lg font-bold text-white">${appState.userEmail}</h2>
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-500/20 text-brand-400 border border-brand-500/30">${appState.selectedRole}</span>
                            </div>
                            <p class="text-xs text-slate-400 font-mono mt-0.5">Session Token: jwt_bearer_ecdsa_p256_valid</p>
                        </div>
                    </div>

                    <button onclick="setAuthStep('login')" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center space-x-2">
                        <i class="fa-solid fa-right-from-bracket"></i><span>Sign Out</span>
                    </button>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 class="text-sm font-bold text-white flex items-center space-x-2"><i class="fa-solid fa-calculator text-brand-400"></i><span>Cryptographic SHA-256 Custody Engine</span></h3>
                            <span class="text-[11px] font-mono text-slate-500">SubtleCrypto WebAPI</span>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-300 mb-2">Simulate File Upload &amp; Hash Extraction</label>
                            <input type="file" id="evidence-file-input" onchange="processFileHash(event)" class="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-500 file:text-slate-950 hover:file:bg-brand-400 cursor-pointer bg-slate-950 border border-slate-800 rounded-xl">
                        </div>

                        <div class="pt-2">
                            <label class="block text-xs font-semibold text-slate-300 mb-1">Or Enter Raw Digital Evidence Metadata / Text Payload:</label>
                            <textarea id="evidence-text-input" oninput="processTextHash(this.value)" rows="3" placeholder="Enter case file transcript, log payload, or custody event detail..." class="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500 transition"></textarea>
                        </div>

                        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                            <span class="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Calculated Immutable SHA-256 Fingerprint:</span>
                            <p id="hash-output" class="font-mono text-xs text-emerald-400 break-all bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">${appState.generatedHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</p>
                            <div class="flex justify-end pt-1">
                                <button onclick="anchorToLedger()" class="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5">
                                    <i class="fa-solid fa-cubes"></i><span>Anchor Hash to Permissioned Ledger</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                        <div>
                            <h3 class="text-sm font-bold text-white mb-3 flex items-center space-x-2"><i class="fa-solid fa-list-check text-emerald-400"></i><span>Audit Ledger Stream</span></h3>
                            <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1 code-scroll">
                                ${appState.auditLogs.map(log => `
                                    <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px]">
                                        <div class="flex justify-between text-slate-400 font-mono text-[10px]"><span>${log.id}</span><span>${log.time}</span></div>
                                        <p class="font-semibold text-slate-200 mt-0.5">${log.event}</p>
                                        <p class="font-mono text-brand-400 text-[10px] truncate mt-0.5">${log.hash}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                            <div class="flex justify-between"><span>PostgreSQL Metadata Sync:</span><span class="text-emerald-400 font-mono">ONLINE</span></div>
                            <div class="flex justify-between"><span>Encrypted Blob Storage:</span><span class="text-emerald-400 font-mono">CONNECTED</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateStepBadges();
}

function switchView(view) {
    appState.currentView = view;

    const liveView = document.getElementById('view-live');
    const codeView = document.getElementById('view-code');
    const btnLive = document.getElementById('btn-mode-live');
    const btnCode = document.getElementById('btn-mode-code');

    if (view === 'live') {
        liveView.classList.remove('hidden');
        codeView.classList.add('hidden');
        btnLive.className = "px-4 py-2 rounded-lg text-sm font-medium transition-all bg-brand-500 text-slate-950 hover:bg-brand-400 flex items-center space-x-2 font-semibold shadow-md shadow-brand-500/20";
        btnCode.className = "px-4 py-2 rounded-lg text-sm font-medium transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center space-x-2 border border-slate-700";
    } else {
        liveView.classList.add('hidden');
        codeView.classList.remove('hidden');
        btnCode.className = "px-4 py-2 rounded-lg text-sm font-medium transition-all bg-brand-500 text-slate-950 hover:bg-brand-400 flex items-center space-x-2 font-semibold shadow-md shadow-brand-500/20";
        btnLive.className = "px-4 py-2 rounded-lg text-sm font-medium transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center space-x-2 border border-slate-700";
        selectCodeFile(appState.selectedCodeFile);
    }
}

function setRole(role) {
    appState.selectedRole = role;
    renderLiveStage();
}

function setMFAMethod(method) {
    appState.selectedMFA = method;
    renderLiveStage();
}

function setAuthStep(step) {
    appState.authStep = step;
    renderLiveStage();
}

function handleLoginSubmit(e) {
    e.preventDefault();
    const emailInput = document.getElementById('input-email');
    if (emailInput) appState.userEmail = emailInput.value;
    showToast('OIDC Authentication Passed', 'Credentials verified. Redirecting to MFA challenge step.');
    setAuthStep('mfa');
}

function simulateMFAPass() {
    showToast('WebAuthn Authenticated', 'Hardware cryptographic assertion validated.');
    setAuthStep('dashboard');
}

async function processTextHash(val) {
    if (!val) {
        appState.generatedHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    } else {
        const encoder = new TextEncoder();
        const data = encoder.encode(val);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        appState.generatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const out = document.getElementById('hash-output');
    if (out) out.innerText = appState.generatedHash;
}

async function processFileHash(e) {
    const file = e.target.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    appState.generatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const out = document.getElementById('hash-output');
    if (out) out.innerText = appState.generatedHash;

    showToast('File Hashed In-Browser', `Calculated SHA-256 for ${file.name}`);
}

function anchorToLedger() {
    const currentHash = appState.generatedHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    const logEntry = {
        id: 'LOG-' + Math.floor(1000 + Math.random() * 9000),
        event: `Evidence Anchored by ${appState.selectedRole.toUpperCase()}`,
        time: new Date().toISOString().substring(11, 19) + ' UTC',
        hash: '0x' + currentHash.substring(0, 16) + '...'
    };

    appState.auditLogs.unshift(logEntry);
    showToast('Permissioned Ledger Updated', 'Cryptographic proof committed to chain.');
    renderLiveStage();
}

function updateStepBadges() {
    const badgeAuth = document.getElementById('step-badge-auth');
    const badgeMfa = document.getElementById('step-badge-mfa');
    const badgeApp = document.getElementById('step-badge-app');

    if (!badgeAuth) return;

    badgeAuth.className = "px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1";
    badgeMfa.className = "px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1";
    badgeApp.className = "px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1";

    if (appState.authStep === 'login') {
        badgeAuth.className = "px-3 py-1 rounded-lg text-xs font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/40 flex items-center space-x-1";
    } else if (appState.authStep === 'mfa') {
        badgeMfa.className = "px-3 py-1 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center space-x-1";
    } else if (appState.authStep === 'dashboard') {
        badgeApp.className = "px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1";
    }
}

async function selectCodeFile(fileName) {
    appState.selectedCodeFile = fileName;

    document.querySelectorAll('.file-tab-btn').forEach(btn => {
        btn.className = "file-tab-btn w-full text-left px-3 py-2.5 rounded-lg text-sm font-mono flex items-center justify-between text-slate-400 hover:bg-slate-800/50 hover:text-slate-200";
    });

    const activeBtn = document.getElementById(`file-btn-${fileName}`);
    if (activeBtn) {
        activeBtn.className = "file-tab-btn w-full text-left px-3 py-2.5 rounded-lg text-sm font-mono flex items-center justify-between text-brand-400 bg-brand-500/10 border border-brand-500/30 font-semibold";
    }

    document.getElementById('active-filename-display').innerText = fileName;

    try {
        const response = await fetch(`/api/source/${encodeURIComponent(fileName)}`);
        if (!response.ok) throw new Error('Source file unavailable');

        const rawContent = await response.text();
        document.getElementById('code-content-box').textContent = rawContent;
        document.getElementById('code-lines-count').innerText = `${rawContent.split('\n').length} Lines`;
    } catch (error) {
        document.getElementById('code-content-box').textContent =
            `Unable to load ${fileName}. Start the project with: npm start`;
        document.getElementById('code-lines-count').innerText = 'Source unavailable';
    }
}

async function getSourceFile(fileName) {
    const response = await fetch(`/api/source/${encodeURIComponent(fileName)}`);
    if (!response.ok) throw new Error(`Could not load ${fileName}`);
    return response.text();
}

async function copyCurrentFileCode() {
    try {
        const code = await getSourceFile(appState.selectedCodeFile);
        await navigator.clipboard.writeText(code);
        showToast('Code Copied!', `${appState.selectedCodeFile} copied to clipboard.`);
    } catch {
        showToast('Copy Failed', 'Start the Node.js server and try again.');
    }
}

async function downloadProjectBundle() {
    const files = ['index.html', 'styles.css', 'app.js', 'server.js', 'App.jsx', 'package.json', 'README.md'];
    let combinedBundle = `=================================================================\n`;
    combinedBundle += `SAKSHYA - MULTI-FILE PROJECT SOURCE BUNDLE\n`;
    combinedBundle += `=================================================================\n\n`;

    for (const filename of files) {
        try {
            const content = await getSourceFile(filename);
            combinedBundle += `\n/* ============================================================= */\n`;
            combinedBundle += `/* FILE: ${filename} */\n`;
            combinedBundle += `/* ============================================================= */\n\n`;
            combinedBundle += content + `\n\n`;
        } catch {
            // Keep export resilient if a non-client file cannot be fetched.
        }
    }

    const blob = new Blob([combinedBundle], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SAKSHYA_source_bundle.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Project Exported', 'All source files generated in single bundle.');
}

function showToast(title, message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-message').innerText = message;

    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 3000);
}

window.addEventListener('load', () => {
    renderLiveStage();
    selectCodeFile('index.html');
});
