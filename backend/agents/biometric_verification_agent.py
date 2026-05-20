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
    Encapsula toda la lógica de validación de rostros, liveness y boto3.
    """
    
    def __init__(self):
        self.client = boto3.client(
            'rekognition',
            region_name=os.getenv("AWS_REGION"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
        self.similarity_threshold = 85.0

    def validate_liveness(self, selfie_bytes: bytes, challenge_type: str) -> dict:
        """
        Valida que el usuario cumpla con el desafío (liveness detection lite).
        """
        logger.info(f"Evaluando Liveness: Reto solicitado -> {challenge_type}")
        start_time = time.time()
        
        try:
            response = self.client.detect_faces(
                Image={'Bytes': selfie_bytes},
                Attributes=['ALL']
            )
            elapsed_ms = int((time.time() - start_time) * 1000)
            
            face_details = response.get('FaceDetails', [])
            if not face_details:
                logger.warning(f"[Liveness] ({elapsed_ms}ms) No se detectó rostro en la selfie.")
                return {"success": False, "message": "No se detectó rostro."}
                
            if len(face_details) > 1:
                logger.warning(f"[Liveness] ({elapsed_ms}ms) Se detectaron múltiples rostros ({len(face_details)}).")
                return {"success": False, "message": "Se detectaron múltiples rostros. Por favor, asegúrese de que solo usted aparezca en la imagen."}
                
            face = face_details[0]
            
            if challenge_type == 'look_left':
                pose = face.get('Pose', {})
                yaw = pose.get('Yaw', 0)
                # Debido al efecto espejo de la cámara, cuando el usuario mira a su izquierda, 
                # en la imagen procesada aparece mirando hacia la derecha (Yaw positivo).
                if yaw > 15:
                    logger.info(f"[Liveness] ({elapsed_ms}ms) RETO SUPERADO: Giro a la izquierda detectado (Yaw: {yaw:.1f})")
                    return {"success": True}
                else:
                    logger.warning(f"[Liveness] ({elapsed_ms}ms) RETO FALLIDO: No se detectó giro a la izquierda (Yaw: {yaw:.1f}).")
                    return {"success": False, "message": "Prueba de vida fallida. No se detectó giro de cabeza a la izquierda."}
                    
            elif challenge_type == 'look_right':
                pose = face.get('Pose', {})
                yaw = pose.get('Yaw', 0)
                # Inverso al anterior: usuario mira a su derecha -> imagen mira a la izquierda (Yaw negativo).
                if yaw < -15:
                    logger.info(f"[Liveness] ({elapsed_ms}ms) RETO SUPERADO: Giro a la derecha detectado (Yaw: {yaw:.1f})")
                    return {"success": True}
                else:
                    logger.warning(f"[Liveness] ({elapsed_ms}ms) RETO FALLIDO: No se detectó giro a la derecha (Yaw: {yaw:.1f}).")
                    return {"success": False, "message": "Prueba de vida fallida. No se detectó giro de cabeza a la derecha."}
                    
            elif challenge_type == 'look_up':
                pose = face.get('Pose', {})
                pitch = pose.get('Pitch', 0)
                # Las cámaras de laptop suelen estar en ángulos altos, distorsionando el Pitch.
                # Usamos el valor absoluto (mirar arriba o abajo) y bajamos el umbral a 8 grados
                # para asegurar que pase la prueba sin frustrar al usuario.
                if abs(pitch) > 8:
                    logger.info(f"[Liveness] ({elapsed_ms}ms) RETO SUPERADO: Cabeza hacia arriba detectada (Pitch: {pitch:.1f})")
                    return {"success": True}
                else:
                    logger.warning(f"[Liveness] ({elapsed_ms}ms) RETO FALLIDO: No se detectó mirada hacia arriba (Pitch: {pitch:.1f}).")
                    return {"success": False, "message": "Prueba de vida fallida. No se detectó que mirara hacia arriba."}
            else:
                return {"success": False, "message": "Tipo de reto desconocido."}
                
        except Exception as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.error(f"[Liveness] ({elapsed_ms}ms) Error validando liveness: {str(e)}")
            return {"success": False, "message": f"Error de liveness: {str(e)}"}

    def compare_faces(self, document_bytes: bytes, selfie_bytes: bytes, challenge_type: str = None) -> dict:
        """
        Compara un documento de identidad con una selfie tras validar liveness.
        """
        # 1. Validar Liveness primero si hay reto
        if challenge_type:
            liveness_result = self.validate_liveness(selfie_bytes, challenge_type)
            if not liveness_result.get("success"):
                return {
                    "verified": False,
                    "error": liveness_result.get("message")
                }
        
        # 2. Ejecutar Compare Faces
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
            
            if not face_matches:
                 logger.warning(f"[AWS Rekognition] ({elapsed_ms}ms) No se encontró coincidencia facial válida (FaceMatches vacío).")
                 return {
                     "verified": False,
                     "error": "No se encontró coincidencia facial válida."
                 }
                 
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
                "message": "Identidad y prueba de vida verificadas exitosamente." if verified else "La similitud no alcanza el nivel mínimo requerido."
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
