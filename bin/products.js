const utils = require( "./utils" ),
    fs = require( "fs" ),
    path = require( "path" ),
    template = require( "mustache" ),
    utf8 = "utf-8",
    productTemplate = fs.readFileSync( "../www/html/templates/product.template.html", utf8 );


module.exports = {

    buildProductPages: function ( defaultPage ) {

        return new Promise( function ( resolve, reject ) {

            let products = utils.readJSON("../www/api/products.json");

                for (let i = 0; i < products.length; i++) {

                    let product = products[i];

                    product = Object.assign({}, defaultPage, product);

                    product.slug = "product/" + utils.makeSlug(product.Name);
                    product.photo = utils.makeSlug(product.Name) + ".jpg";
                    product.body = template.render(productTemplate, product);

                    utils.createFile("./config/pages/" + product.slug + ".json", JSON.stringify(product), true);

                }

                resolve();

        } );

    }

};