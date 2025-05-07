// Store credentials
const credentials = new Map();

// Helper function to get API URL
function getApiUrl() {
    return document.getElementById('apiUrl').value;
}

// Helper function to get effective domain
function getEffectiveDomain() {
    return window.location.hostname;
}

// Helper function to get effective origin
function getEffectiveOrigin() {
    return window.location.origin;
}

// Helper function to display results
function displayResult(result) {
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = JSON.stringify(result, null, 2);
}

// Helper function to send data to API
async function sendToApi(endpoint, data) {
    const apiUrl = getApiUrl();
    try {
        const response = await fetch(`${apiUrl}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        displayResult(result);
        return result;
    } catch (err) {
        console.error(err);
        displayResult({ error: err.message });
    }
}

// Enrollment function
async function enrollCredential(credentialNumber) {
    try {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const effectiveDomain = getEffectiveDomain();
        console.log("Enrolling with domain:", effectiveDomain);

        const credentialOptions = {
            publicKey: {
                challenge: challenge,
                rp: {
                    name: "SPC Demo",
                    id: effectiveDomain
                },
                user: {
                    id: new Uint8Array([credentialNumber]),
                    name: `user${credentialNumber}@example.com`,
                    displayName: `User ${credentialNumber}`
                },
                pubKeyCredParams: [
                    {
                        type: "public-key",
                        alg: -7  // ES256
                    },
                    {
                        type: "public-key",
                        alg: -257 // RS256
                    }
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    residentKey: "preferred",
                    requireResidentKey: true,
                    userVerification: "required"
                },
                timeout: 60000,
                attestation: "none",
                extensions: {
                    payment: {
                        isPayment: true
                    }
                }
            }
        };

        console.log("Enrollment options:", credentialOptions);
        const credential = await navigator.credentials.create(credentialOptions);
        
        // Store credential
        credentials.set(credentialNumber, credential);
        window.localStorage.setItem('credential' + credentialNumber, 
            btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
        
        console.log("Credential stored:", credential);
        displayResult({ status: 'success', credential: credential });

        // Send to API
        await sendToApi('enroll', {
            credentialNumber,
            credential: credential
        });
        
        alert(`Successfully enrolled credential #${credentialNumber}`);
    } catch (err) {
        console.error("Enrollment error:", err);
        alert(`Error enrolling credential #${credentialNumber}: ${err.message}`);
        displayResult({ error: err.message });
    }
}

// Payment function
async function pay(credentialNumber) {
    let storedCredential;
    try {
        const credentialId = window.localStorage.getItem('credential' + credentialNumber);
        if (!credentialId) {
            throw new Error(`Credential #${credentialNumber} not found. Please enroll first.`);
        }

        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const effectiveDomain = getEffectiveDomain();
        const effectiveOrigin = getEffectiveOrigin();

        console.log("Payment domain:", effectiveDomain);
        console.log("Payment origin:", effectiveOrigin);

        const paymentOptions = {
            challenge: challenge,
            rpId: effectiveDomain,
            credentialIds: [Uint8Array.from(atob(credentialId), c => c.charCodeAt(0))],
            payeeOrigin: effectiveOrigin,
            instrument: {
                displayName: "Test Card",
                icon: "https://lengzhao.github.io/img/troy-card-art.png"
            },
            timeout: 60000,
            userVerification: "required"
        };

        console.log("Payment options:", paymentOptions);

        const request = new PaymentRequest([{
            supportedMethods: "secure-payment-confirmation",
            data: paymentOptions
        }], {
            total: {
                label: "Total",
                amount: { currency: "USD", value: "0.01" }
            }
        });

        console.log("Payment request created:", request);
        const result = await request.show();
        await result.complete("success");
        console.log("Payment result:", result);
        displayResult({ status: 'success', payment: result });

        // Send to API
        await sendToApi('pay', {
            credentialNumber,
            payment: result
        });
        
        alert("Payment successful!");
    } catch (err) {
        console.error(err);
        alert(`Payment error: ${err.message}`);
        displayResult({ error: err.message });
    }
}

// Login function
async function login(credentialNumber) {
    try {
        const credentialId = window.localStorage.getItem('credential' + credentialNumber);
        if (!credentialId) {
            throw new Error(`Credential #${credentialNumber} not found. Please enroll first.`);
        }

        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const assertionOptions = {
            publicKey: {
                challenge: challenge,
                allowCredentials: [{
                    id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
                    type: 'public-key',
                }],
                timeout: 60000,
                userVerification: "required"
            }
        };

        const assertion = await navigator.credentials.get(assertionOptions);
        console.log("Login result:", assertion);
        displayResult({ status: 'success', login: assertion });

        // Send to API
        await sendToApi('login', {
            credentialNumber,
            login: assertion
        });
        
        alert(`Successfully authenticated with credential #${credentialNumber}`);
    } catch (err) {
        console.error(err);
        alert(`Login error: ${err.message}`);
        displayResult({ error: err.message });
    }
}

// Check if the browser supports WebAuthn
if (!window.PublicKeyCredential) {
    alert("Warning: Your browser does not support WebAuthn!");
    document.querySelectorAll('button').forEach(button => button.disabled = true);
} else {
    if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
            .then((available) => {
                console.log("Platform authenticator available:", available);
            })
            .catch((err) => {
                console.error("Error checking platform authenticator:", err);
            });
    }
} 