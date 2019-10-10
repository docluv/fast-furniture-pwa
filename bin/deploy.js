/*

    - determine environment
    - build assets for environment
    - identify files that have changed since the last deploy
        - initially by date updated
        - ultimately track file hash for comparison
    - upload those files to environment bucket
        - apply Cache-Control header
        - apply gzip to text based assets
    - log file uploads
    - store timestamp key for deployment


*/


var fs = require('fs'),
    glob = require("glob"),
    crypto = require("crypto"),
    path = require('path'),
    AWS = require('aws-sdk'),
    mime = require('mime-types'),
    zlib = require('zlib'),
    //change to this module - https://www.npmjs.com/package/content-type
    contentTypes = {
        ".txt": "text",
        ".json": "application/json; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".png": "image/png",
        ".gif": "image/gif",
        ".jpg": "image/jpg",
        ".ico": "image",
        ".xml": "text/xml",
        ".svg": "image/svg+xml",
        ".eot": "application/octet-stream",
        ".ttf": "application/font-ttf",
        ".woff": "application/font-woff",
        ".woff2": "application/font-woff2",
        ".appcache": "text/manifest; charset=utf-8",
        ".manifest": "text/manifest; charset=utf-8",
        ".webmanifest": "text/manifest; charset=utf-8"
    },
    bucket = 'fastfurniture.love2dev.com',
    environment = process.argv[2] || "localhost",
    configSrc = path.join(__dirname, "deploy", environment + ".deploy.config");

var options = {};

//AWS.config.region = 'US Standard';

var s3 = new AWS.S3(),
    params = {
        Bucket: bucket
    },
    // params = {
    //     Bucket: 'dev.love2dev.com'
    // },
    adminS3 = new AWS.S3({
        params: params
    });


/*

1. How to read a stream
2. How to compress stream using zlib
3. How to set cache control header
-

*/

function getHash(data) {
    var md5 = crypto.createHash('md5');
    md5.update(data);

    return md5.digest('hex');
}

function getFileAndSizeAndHashForFile(file) {
    var stat = fs.statSync(file);

    if (stat.isFile()) {
        var buffer = fs.readFileSync(file);
        return {
            file: file,
            size: stat.size,
            hash: getHash(buffer)
        };
    }

    return null;
}

function getLastFileSizeAndHash(file, config) {

    for (var i = 0; i < config.length; i++) {

        if (config[i].file.toLowerCase() === file) {
            return config[i];
        }

    }

}

function updateFileSizeAndHash(file, config) {

    var found = false;

    for (var i = 0; i < config.length; i++) {

        if (config[i].file.toLowerCase() === file.toLowerCase()) {
            config[i] = getFileAndSizeAndHashForFile(file);
            i = config.length;
            found = true;
        }

    }

    if (!found) {
        config.push(getFileAndSizeAndHashForFile(file));
    }

    return config;

}

function canZip(type) {

    if (/jpg|gif|png|pdf|zip|ico/.test(type)) {
        return;
    }

    return "gzip";

}

function getCacheControl(filename){

    var ext = path.extname(filename);

    if (ext === ".gif" || ext === ".jpg" || ext === ".png") {
        return "private, public, max-age=31536000, s-max-age=10900";
    }

    return "private, max-age=3600, s-max-age=300";

}

function UploadToS3(src, filename, target) {

    //    target = target.replace(/\/$/, '').replace(/\\/g, "/");

    var key = "",
        ext = path.extname(filename),
        zippable = canZip(ext);

    if (target && target !== "") {

        key = target + "/" + filename;

    } else {
        key = filename;
    }

    //2592000
    var cacheControl = "public, max-age=10080, s-max-age=300";

    if (/html/.test(ext)) {
        cacheControl = "private, max-age=3600, s-max-age=300";
    } else if (/\.css|\.js/.test(ext)) {
        cacheControl = "private, max-age=36000, s-max-age=300";
    }


    var params = {
        Bucket: bucket,
        ContentType: mime.lookup(ext) || "text",
        CacheControl: cacheControl,
        ACL: "public-read",
        Key: key
    };

    if (zippable) {
        params.ContentEncoding = "gzip";
    }


    if (ext === ".gif" || ext === ".jpg" || ext === ".png") {

        params.Body = fs.createReadStream(src);

        adminS3.putObject(params, function (err, data) {

            if (err) {

                console.error("Error! ", err);
                console.error("params ", params.Bucket);

            } else {

                console.log("Successfully uploaded " + filename + ". ");
            }

        });

    } else {

        params.Body = fs.createReadStream(src).pipe(zlib.createGzip({
            level: 9
        }));

        adminS3.upload(params, function (err, data) {

            if (err) {

                console.error("Error! ", err);
                console.error("params ", params.Bucket);

            } else {

                console.log("Successfully uploaded " + filename + ". ", data);

            }

        });

    }

}

function getDeployStats() {

    //read deploy.config and return object
    var config = fs.createReadStream(configSrc);

    if (!config) {
        config = [];
    } else {
        config = JSON.parse(config);
    }

    return config;
}

function getFilestoDeploy() {

    var config = getDeployStats();


}

console.log(environment);

if (environment && environment !== "") {

    var deployConfig = path.resolve(__dirname, environment + ".deploy.json"),
        config = [];

    //if (fs.exists(deployConfig)) {

    config = JSON.parse(fs.readFileSync(deployConfig, "utf-8"));

    //}


    var srcPath = path.join(__dirname.replace("bin", ""), "site/www/" + environment);

    console.log("srcPath: ", srcPath);

    glob(srcPath + "/**/*.html", {}, function (er, files) {
        // files is an array of filenames. 
        // If the `nonull` option is set, and nothing 
        // was found, then files is ["**/*.js"] 
        // er is an error object or null. 

        var fileStats,
            folder,
            i = 0,
            len = files.length,
            src,
            fileHash, lastFileHash;

            console.log(len);

        for (; i < len; i++) {

            src = files[i];

            fileStats = fs.statSync(src);

            fileName = path.basename(src);

            //avoid uploading images for now
            if (!fileName.match(/.jpg|.gif|.png/g)) {

                folder = path.resolve(path.dirname(src))
                    .replace(path.resolve(srcPath), "")
                    .replace(/\\/g, "/")
                    .replace(/\//, "");


                //console.log("uploading ", fileName, " to ", folder);

                // fileHash = getFileAndSizeAndHashForFile(src);

                // lastFileHash = getLastFileSizeAndHash(src.toLowerCase(), config);

                // if (!lastFileHash || (lastFileHash.hash !== fileHash.hash)) {
                    //add to new config && upload
                    UploadToS3(files[i], fileName, folder);
                //     config = updateFileSizeAndHash(src, config);

                // }

            }

        }

        fs.writeFileSync(deployConfig, JSON.stringify(config), "utf-8");

    });

}