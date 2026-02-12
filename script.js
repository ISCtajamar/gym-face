const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const msg = document.getElementById('msg');
const btnAcceso = document.getElementById('btnAcceso');

// --- CONFIGURACIÓN AZURE (Sustituye con tus datos) ---
const FACE_ENDPOINT = "https://TU_RECURSO.cognitiveservices.azure.com/face/v1.0/detect?returnFaceAttributes=emotion";
const FACE_KEY = "TU_API_KEY";
const BACKEND_URL = "https://TU_AZURE_FUNCTION.azurewebsites.net/api/registro";

// Iniciar cámara
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream);

btnAcceso.addEventListener('click', async () => {
    msg.innerText = "Analizando rostro...";
    msg.style.color = "black";

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, 400, 300);

    canvas.toBlob(async (blob) => {
        try {
            // 1. Llamada a Face API para emociones
            const response = await fetch(FACE_ENDPOINT, {
                method: 'POST',
                headers: { 
                    'Ocp-Apim-Subscription-Key': FACE_KEY, 
                    'Content-Type': 'application/octet-stream' 
                },
                body: blob
            });
            const data = await response.json();

            if (data.length === 0) {
                msg.innerText = "No se detectó ningún rostro.";
                return;
            }

            // Extraer emoción dominante
            const emociones = data[0].faceAttributes.emotion;
            const emocionPrincipal = Object.keys(emociones).reduce((a, b) => emociones[a] > emociones[b] ? a : b);

            // 2. Enviar datos al Backend (Azure Function -> SQL)
            const registro = {
                socioId: document.getElementById('socioId').value,
                tipo: document.getElementById('tipoUsuario').value,
                sala: document.getElementById('salaDestino').value,
                emocion: emocionPrincipal
            };

            const dbResponse = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registro)
            });

            const result = await dbResponse.json();
            
            if (result.success) {
                msg.innerText = `¡Bienvenido! Ánimo: ${emocionPrincipal}`;
                msg.style.color = "green";
                actualizarDashboard();
            } else {
                msg.innerText = "Error: " + result.error;
                msg.style.color = "red";
            }

        } catch (err) {
            msg.innerText = "Error de conexión.";
            console.error(err);
        }
    }, 'image/jpeg');
});

async function actualizarDashboard() {
    // Aquí harías un fetch a tu API para obtener los conteos de SQL
    // y actualizarías countSocios, countInvitados y listaSalas
}
