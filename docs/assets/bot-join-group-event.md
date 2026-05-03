GROUP JOIN EVENT:

{
"id": "120363424179431399@g.us",
"subject": "Geral",
"linkedParent": "120363425471230694@g.us",
"participants": [
{
"id": "75655932829836@lid",
"admin": "admin",
"phoneNumber": "75655932829836"
},
{
"id": "89254101270734@lid",
"admin": null,
"phoneNumber": "89254101270734"
},
{
"id": "80779862376482@lid",
"admin": null,
"phoneNumber": "80779862376482"
}
],
"creation": 1775286060,
"owner": "75655932829836@lid",
"desc": "Um grupo no qual os membros da comunidade podem falar sobre o que quiserem"
}

explicações das propriedades
id = whatsapp registry do grupo
subject = nome do grupo, na propriedade name da tabela postgres
linkedParent = é o whatsapp registry do grupo pai, que no caso é a chamado de Comunidade, existem grupos que pertencem a comunidades
owner = id whatsapp registry do participante que criou o grupo
desc = até o dado momento 0105/2025, não existe hoje um campo na tabela de dados para armazenar a descrição do grupo, até o momento é preciso validar, por favor, criar se necessário nos arquivos e atualizar por favor a tabela de dados com essa migração
