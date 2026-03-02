# Étape 1 : Utiliser une image de base Node.js
FROM node:14

# Étape 2 : Définir le répertoire de travail
WORKDIR /app

# Étape 3 : Créer le fichier de configuration de l'application
RUN echo "const http = require('http');\n\
const port = 8080;\n\
const defaultWelcomeMessage = 'Bienvenue sur notre site de démonstration !';\n\
const defaultAppMode = 'développement';\n\
const defaultApiToken = 'defaultToken';\n\
const welcomeMessage = process.env.WELCOME_MESSAGE || defaultWelcomeMessage;\n\
const appMode = process.env.APP_MODE || defaultAppMode;\n\
const apiToken = process.env.API_TOKEN || defaultApiToken;\n\
const htmlContent = \`<!DOCTYPE html>\n\
<html lang='fr'>\n\
<head>\n\
    <meta charset='UTF-8'>\n\
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n\
    <title>Welcome App</title>\n\
    <style>\n\
        body {\n\
            display: flex;\n\
            justify-content: center;\n\
            align-items: center;\n\
            height: 100vh;\n\
            margin: 0;\n\
            background-color: #202cac;\n\
            color: #ff0454;\n\
            font-family: Arial, sans-serif;\n\
            text-align: center;\n\
        }\n\
        h1 {\n\
            font-size: 3rem;\n\
        }\n\
        .info {\n\
            font-size: 2rem;\n\
            color: #ffc404;\n\
            margin-top: 20px;\n\
        }\n\
    </style>\n\
</head>\n\
<body>\n\
    <h1>\${welcomeMessage}</h1>\n\
    <p class='info'>\n\
        Mode de l'application: \${appMode}<br />\n\
        Token API: \${apiToken}\n\
    </p>\n\
</body>\n\
</html>\`;\n\
http.createServer((req, res) => {\n\
    res.writeHead(200, { 'Content-Type': 'text/html' });\n\
    res.end(htmlContent);\n\
}).listen(port, () => {\n\
    console.log(\`Serveur en cours d'exécution sur le port \${port}\`);\n\
});" > server.js

# Étape 4 : Exposer le port
EXPOSE 8080

# Étape 5 : Démarrer l'application
CMD ["node", "server.js"]

