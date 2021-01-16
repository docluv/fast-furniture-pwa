(function () {

    "use strict";

    //Constants here

    var profile,
        USER_KEY = "user-profile-",
        USER = "user",
        recordLifeSpan = 60 * 15; //1 hour

    function getUser(options) {

        if (!options.id) {
            return Promise.reject(
                "no user id supplied"
            );
        }

        return love2dev.http.cacheAndFetch({
            "authorized": options.authorized || false,
            "key": USER_KEY + "-" + options.id,
            "ttl": recordLifeSpan,
            "url": apiBase + USER + "?id=" + options.id
        });

    }

    function getUserByUsername(options) {

        if (!options.username) {

            return Promise.reject("no valid username criteria supplied");

        }

        return love2dev.http.cacheAndFetch({
            "authorized": options.authorized || false,
            "key": USER_KEY + options.username,
            "ttl": recordLifeSpan,
            "url": apiBase + USER + "?username=" + options.username
        });

    }

    function updateUser(user) {
        
        var key = USER_KEY + user.username;

        if (!user.notifications) {
            user.notifications = {
                "purchase": true,
                "announcement": false
            };
        }

        if (!user.communicationChannels) {
            user.communicationChannels = {
                "email": true,
                "push": false,
                "sms": false
            };
        }


        return love2dev.http.postAndClearCache({
                authorized: false,
                url: apiBase + USER,
                "key": key,
                entityKey: USER,
                body: JSON.stringify(user)
            })
            .then(function (_user) {

                //temporary while I create a more permanent solution
                if (_user && !_user.exist) {

                    return love2dev.http.cacheTTLValue({
                            key: USER_KEY,
                            value: _user,
                            ttl: recordLifeSpan
                        })
                        .then(function () {
                            return _user;
                        });

                } else {

                    return localforage.setItem(key, user)
                        .then(function () {

                            user.exist = true;

                            return user;

                        });

                }

            });

    }

    function getProfile() {

        if (profile) {
            return Promise.resolve(profile);
        }

        var username;

        return love2dev.auth.getUserAttributes()
            .then(function (attributes) {

                if (attributes && attributes["cognito:username"]) {

                    username = attributes["cognito:username"];

                    return localforage.getItem(USER_KEY + username)
                        .then(function (user) {
                            if (user) {
                                profile = user;
                                return user;
                            } else {

                                return getUserByUsername({
                                        "username": username
                                    })
                                    .then(p => {

                                        profile = p;

                                        return profile;

                                    });

                            }

                        });

                }

            });

    }

    function purgeCachedUser(user) {

        return localforage.removeItem(USER_KEY + user.username)
            .then(function () {
                return localforage.removeItem(USER_KEY + user.username + "-expires");
            })
            .then(function () {
                return localforage.removeItem(USER_KEY + user.assetId);
            })
            .then(function () {
                return localforage.removeItem(USER_KEY + user.assetId + "-expires");
            })
            .then(function () {

                profile = undefined;

            });

    }

    window.love2dev = window.love2dev || {};

    window.love2dev.user = {
        getProfile: getProfile,
        getUserByUsername: getUserByUsername,
        purgeCachedUser: purgeCachedUser,
        getUser: getUser,
        updateUser: updateUser
    };

})();5av5g5lu99vl76ui8i6p