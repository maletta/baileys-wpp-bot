========== SOCKET socket.ev "group-participants.update" (payload bruto) ==========
========== GROUP PARTICIPANTS UPDATE EVENT ==========
OBJETO COMPLETO DO EVENTO:
{
"id": "120363424179431399@g.us",
"author": "75655932829836@lid",
"participants": [
{
"id": "75655932829836@lid",
"phoneNumber": "5511986293165@s.whatsapp.net",
"admin": null
}
],
"action": "remove"
}
====================================================

descrição das propriedades do objeto

id representa a propriedade whatsappRegistry da base de dados de groups_wpp
author representa o whats app registry da tabela participant_wpp do participante que está executando a alteração
participants representa os participantes afetados
participants.id representa o whatsapp registry do participante sofrendo alteração
participants.phoneNumber representa uma string que contendo o número de celular do usuário particpante, armazenado no campo cellphone da tabela participants_wpp

propriedade action representa a ação que está sendo realizada
