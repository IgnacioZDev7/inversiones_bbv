from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from agents.biometric_verification_agent import BiometricVerificationAgent
from rest_framework.parsers import MultiPartParser

class BiometricVerifyView(APIView):
    """
    Endpoint para verificar la identidad del usuario comparando 
    una imagen de su documento de identidad con una selfie.
    """
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        # 1. Validar que las imágenes estén en el request
        document_file = request.FILES.get('document_image')
        selfie_file = request.FILES.get('selfie_image')

        if not document_file or not selfie_file:
            return Response(
                {"error": "Debe proporcionar 'document_image' y 'selfie_image'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Leer las imágenes directamente en memoria (sin guardar en disco)
        document_bytes = document_file.read()
        selfie_bytes = selfie_file.read()

        # 3. Instanciar el agente y verificar
        agent = BiometricVerificationAgent()
        result = agent.compare_faces(document_bytes, selfie_bytes)

        # 4. Devolver el resultado
        if result.get("verified"):
            return Response(result, status=status.HTTP_200_OK)
        else:
            # Aunque no esté verificado, si la API procesó bien, devolvemos 200 con verified=False
            return Response(result, status=status.HTTP_200_OK)
