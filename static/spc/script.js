// Store credentials
const credentials = new Map();

// Helper function to get API URL
function getApiUrl() {
    return document.getElementById('apiUrl').value;
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
        throw err;
    }
}

// Enrollment function
async function enrollCredential(credentialNumber) {
    try {
        // Generate random challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Get hostname without port
        const hostname = window.location.hostname;

        // Create credential options
        const credentialOptions = {
            publicKey: {
                challenge: challenge,
                rp: {
                    name: "SPC Demo",
                    id: hostname
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
                    requireResidentKey: false,
                    userVerification: "required"
                },
                timeout: 60000,
                attestation: "none"
            }
        };

        console.log("Enrollment options:", credentialOptions);

        // Create credential
        const credential = await navigator.credentials.create(credentialOptions);
        
        // Store credential
        credentials.set(credentialNumber, credential);
        
        // Convert ArrayBuffer to Base64 for transmission
        const credentialData = {
            id: credential.id,
            rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
            type: credential.type,
            response: {
                attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
                clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON)))
            }
        };

        // Send to API
        await sendToApi('enroll', {
            credentialNumber,
            credential: credentialData
        });

        alert(`Successfully enrolled credential #${credentialNumber}`);
    } catch (err) {
        console.error(err);
        alert(`Error enrolling credential #${credentialNumber}: ${err.message}`);
        // Log detailed error information
        console.log("Enrollment error details:", {
            message: err.message,
            name: err.name,
            stack: err.stack
        });
    }
}

// Payment function
async function pay(credentialNumber) {
    let storedCredential;
    try {
        storedCredential = credentials.get(credentialNumber);
        if (!storedCredential) {
            throw new Error(`Credential #${credentialNumber} not found. Please enroll first.`);
        }

        // Generate random challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Get hostname without port
        const hostname = window.location.hostname;
        const origin = window.location.origin;

        const paymentOptions = {
            challenge: challenge,
            rpId: hostname,
            credentialIds: [storedCredential.rawId],
            payeeOrigin: origin,
            instrument: {
                displayName: "Test Card",
                icon: "https://lengzhao.github.io/img/troy-card-art.png"
            },
            timeout: 60000,
            userVerification: "required"
        };

        console.log("Payment options:", paymentOptions);

        // Request payment confirmation
        const result = await new PaymentRequest([{
            supportedMethods: "secure-payment-confirmation",
            data: paymentOptions
        }], {
            total: {
                label: "Total",
                amount: { currency: "USD", value: "0.01" }
            }
        }).show();

        // Convert payment response data for transmission
        const paymentData = {
            details: result.details,
            methodName: result.methodName
        };

        // Send to API
        await sendToApi('pay', {
            credentialNumber,
            payment: paymentData
        });

        await result.complete("success");
        alert("Payment successful!");
    } catch (err) {
        console.error(err);
        alert(`Payment error: ${err.message}`);
        // Log detailed error information
        console.log("Payment error details:", {
            message: err.message,
            name: err.name,
            stack: err.stack,
            storedCredential: storedCredential
        });
    }
}

// Login function
async function login(credentialNumber) {
    try {
        const credential = credentials.get(credentialNumber);
        if (!credential) {
            throw new Error(`Credential #${credentialNumber} not found. Please enroll first.`);
        }

        // Generate random challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const assertionOptions = {
            publicKey: {
                challenge: challenge,
                allowCredentials: [{
                    id: credential.rawId,
                    type: 'public-key',
                }],
                timeout: 60000,
                userVerification: "required"
            }
        };

        // Get assertion
        const assertion = await navigator.credentials.get(assertionOptions);

        // Convert assertion data for transmission
        const assertionData = {
            id: assertion.id,
            rawId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
            type: assertion.type,
            response: {
                authenticatorData: btoa(String.fromCharCode(...new Uint8Array(assertion.response.authenticatorData))),
                clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(assertion.response.clientDataJSON))),
                signature: btoa(String.fromCharCode(...new Uint8Array(assertion.response.signature))),
                userHandle: assertion.response.userHandle ? btoa(String.fromCharCode(...new Uint8Array(assertion.response.userHandle))) : null
            }
        };

        // Send to API
        await sendToApi('login', {
            credentialNumber,
            assertion: assertionData
        });

        alert(`Successfully authenticated with credential #${credentialNumber}`);
    } catch (err) {
        console.error(err);
        alert(`Login error: ${err.message}`);
    }
}

// Check if the browser supports WebAuthn
if (!window.PublicKeyCredential) {
    alert("Warning: Your browser does not support WebAuthn!");
    document.querySelectorAll('button').forEach(button => button.disabled = true);
} 