const utils = require("./utils"),
    path = require("path"),
    cheerio = require("cheerio"),
    uncss = require('uncss'),
    CleanCSS = require('clean-css'),
    cssPath = "../site/www/localhost";



const extractCSS = (options) => {

    return new Promise((resolve, reject) => {

        let html = options.pageHTML;

        // html = html.replace(/<script/g, "<unscript")
        // .replace(/<\/script/g, "</unscript");

        let $ = cheerio.load(html),
            $styles = $("link[rel=stylesheet]"),
            $scripts = $("script"),
            styles = [];

        $scripts.each((index, element) => {

            if ((element.attribs.type && element.attribs.type.indexOf("application/json+ld") < 0) || !element.attribs.type) {
                element.attribs.type = "uncss-script";
            }

        });

        $("link[rel=stylesheet]").remove();

        $styles.each((index, element) => {

            try {

                styles.push(path.resolve(cssPath, element.attribs.href));

            } catch (error) {

                console.error(error);

            }

        });

        console.log(options.file);

        options.stylesheets = styles;

        if (styles.length > 0) {
            //run uncss
            uncss($.html(), options, (error, output) => {

                if (error) {
                    reject(error);
                }

                let minCSS = new CleanCSS({
                    level: 2
                }).minify(output);

                $("head").append("<style>" + minCSS.styles
                    .replace(/\r\n/g, "")
                    .replace(/\/\*!.+?\*\//g, "") + "</style>");

                $scripts.each((index, element) => {

                    if (element.attribs.type === "uncss-script") {
                        element.attribs.type = "application/javascript";
                    }

                });

                // html = $.html();

                // html = html.replace(/<unscript/g, "<script")
                // .replace(/<\/unscript/g, "</script");
        
                resolve($.html());

            });

        } else {

            $scripts.each((index, element) => {

                if (element.attribs.type === "uncss-script" && element.attribs.type != "​application/json+ld") {
                    element.attribs.type = "application/javascript";
                }

            });

            resolve($.html());

        }

        //return html with inline styles

    });

}


exports.optimize = extractCSS;