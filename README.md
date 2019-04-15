# Welcome to the Fast Funriture Example Code

This repository is a stand-alone, full fast furniture site. It includes the latest version of the completed Fast Furniture site, [Chris Love's](https://twitter.com/chrislove) main Progressive Web App (PWA) demo.

You can learn how the applicaiton was built using Progressive Web Application features in the course: [Progressive Web App From Beginner to Expert](https://www.udemy.com/progressive-web-apps-pwa-from-beginner-to-expert/?couponCode=PWACOURSE-29).

## The Source Code

The source code contains the final web site version. You can visit a [live version](https://fastfurniture.love2dev.com/) to see it in action.

The application is served via HTTPS, includes a valid web manifest file and an advanced service worker.

The service worker demonstrates:

- Service Worker Life Cycle Concepts
- Basic and Advanced Caching Strategies
- Offline Fallbacks
- Cache Invalidation
- Service Worker Code Refactoring

The code also includes over 5500 fictional products of an online furniture store. This means the repository is rather large, containing over 20,000 responsive product images and product data files. You will need about 10GB of free disk space.

** I will work on a smaller version in the near future **

## Running the Site

The site is a stand-alone static site. You can use any localhost web server to run the site.

If you want to run the site using the provided infrastructure you will need to have [node](https://nodejs.org/) installed.

Included in the source code is a package.json file with a reference to the http-server node module. You can install it by calling 'npm install'.

To launch the http-server localhost server you can execute 'npm start' from a console. The site is served using port 57661, or http://localhost:57661.

The local web server is configured in the package.json scripts property. You can change the port number if desired.

