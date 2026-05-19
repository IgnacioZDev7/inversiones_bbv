import os
import boto3
import time
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class BiometricVerificationAgent:
    """
    Agente responsable de la verificación biométrica usando AWS Rekognition.
    Encapsula toda la lógica de validación de rostros e interacción con boto3.
    """
    
    def __init__(self):
        self.client = boto3.client(
            'rekognition',
            region_name=os.getenv("AWS_REGION"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
        self.similarity_threshold = 85.0

    def compare_faces(self, document_bytes: bytes, selfie_bytes: bytes) -> dict:
        """
        Compara un documento de identidad con una selfie.
        Retorna un dict con el resultado de la verificación.
        """
        start_time = time.time()
        try:
            logger.info("Iniciando solicitud a AWS Rekognition compare_faces...")
            response = self.client.compare_faces(
                SourceImage={'Bytes': document_bytes},
                TargetImage={'Bytes': selfie_bytes},
                SimilarityThreshold=self.similarity_threshold
            )
            elapsed_ms = int((time.time() - start_time) * 1000)
            
            face_matches = response.get('FaceMatches', [])
            unmatched_faces = response.get('UnmatchedFaces', [])
            
            if not face_matches and not unmatched_faces:
                 logger.warning(f"[AWS Rekognition] ({elapsed_ms}ms) No se detectaron rostros.")
                 return {
                     "verified": False,
                     "error": "No se detectaron rostros en alguna de las imágenes provistas."
                 }
                 
            if face_matches:
                match = face_matches[0]
                similarity = match.get('Similarity', 0)
                confidence = match.get('Face', {}).get('Confidence', 0)
                verified = similarity >= self.similarity_threshold
                
                if verified:
                    logger.info(f"[AWS Rekognition] ({elapsed_ms}ms) VERIFICADO - Similarity: {similarity:.2f}%, Confidence: {confidence:.2f}%")
                else:
                    logger.warning(f"[AWS Rekognition] ({elapsed_ms}ms) RECHAZADO - Similarity: {similarity:.2f}%, Confidence: {confidence:.2f}%")

                return {
                    "verified": verified,
                    "similarity": round(similarity, 2),
                    "confidence": round(confidence, 2),
                    "message": "Identidad verificada exitosamente." if verified else "La similitud no alcanza el nivel mínimo requerido."
                }
            else:
                logger.warning(f"[AWS Rekognition] ({elapsed_ms}ms) Rostros no coinciden.")
                return {
                    "verified": False,
                    "similarity": 0,
                    "confidence": 0,
                    "message": "Los rostros no coinciden."
                }
                
        except self.client.exceptions.InvalidParameterException as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.error(f"[AWS Rekognition] ({elapsed_ms}ms) InvalidParameterException: {str(e)}")
            return {
                "verified": False,
                "error": "Error de procesamiento de imagen. Asegúrese de que ambas imágenes contengan rostros claramente visibles."
            }
        except Exception as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.error(f"[AWS Rekognition] ({elapsed_ms}ms) Error inesperado: {str(e)}")
            return {
                "verified": False,
                "error": f"Error inesperado en AWS Rekognition: {str(e)}"
            }
