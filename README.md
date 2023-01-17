# Salut la team transcendantale !
Voici la marche a suivre pour se servir de cet environement de dev 😁

## Description
Ce repo contient un Makefile, un docker-compose, un .gitignore, et une application de base NestJS nommé ```backend```(c'est le dossier que crée la commande ```nest new```). Dans ce dossier j'ai rajouté un dockerfile et un script (dans le dossier script) qui va être lancé en entrypoint du dockerfile.

## Utilisation
Le Makefile va lancer des commandes docker 📦 pour le docker-compose indiqué dans la variable ```COMPOSEFILE```. Pour l'instant c'est le fichier ```docker-compose.dev.yml``` qu'on va utiliser. </br>

Les règles principales du Makefile:
* ```all``` va build l'image
* ```up``` va build l'image si elle ne l'est pas et run le container
* ```down``` va arrêter le container qui tourne et le supprimer
* ```clean``` lance la règle ```down``` pour l'instant mais est vouée à être complétée
* ```fclean``` va stopper le container qui tourne, le supprimer, supprimer toutes les images, les volumes, les networks et les dossier ```dist``` et ```node_modules``` des applications.

Une fois votre container lancé avec ```make up``` vous n'avez plus qu'à lancer ```docker logs backend -n 1000 -f``` pour voir votre application tourner!

## En détail
Dans le dossier ```backend``` il y a un dockerfile ```Dockerfile.dev``` qui va servir à installer NestJS dans un container node.js et à lancer le script ```docker-entrypoint.dev.sh```, qui se trouve dans le dossier ```script```, en entrypoint. ```oh-my-zsh``` est aussi installé au moment du build mais vous êtes libre d'utiliser le shell que vous voulez bien sûr 😉. </br>

Le script ```docker-entrypoint.dev.sh``` va mettre à jour/installer les modules de l'application node et lancer le script node ```start:dev```. Celui-ci va build l'application et la lancer avec l'option ```--watch``` qui va faire en sorte de rebuild et relancer l'application à chaque fois que vous allez enregistrer des modifications dans un fichier de l'application. </br>

Une fois le container lancé (ça peut être un peu long si vous êtes sur les Mac), vous n'avez plus qu'à lancer la commande ```docker logs backend -n 1000 -f``` pour voir la sortie du script node ```start:dev```.

Et pour rappel, si vous voulez accéder au container avec un terminal il faudra lancer ```docker exec -it backend <votre shell>```.

## Frontend
Pour lancer le daemon de compilation automatique du frontend, il faut lancer `npx nodemon` dans le dossier `/frontend`. Si vous voulez juste compiler une fois, utilisez `npx tsc && npx webpack`. Dans tous les cas, vous devez faire `npm update` une fois pour s'assurer que tout est à jour.
