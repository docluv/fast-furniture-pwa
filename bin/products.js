const utils = require( "./utils" ),
    fs = require( "fs" ),
    path = require( "path" ),
    glob = require( "glob" ),
    template = require( "mustache" ),
    utf8 = "utf-8",
    productTemplate = fs.readFileSync( "../www/html/templates/product.template.html", utf8 );

module.exports = {

    buildProductPages: function ( defaultPage ) {

        return new Promise( function ( resolve, reject ) {

            glob( "../www/api/products/*.json", function ( er, files ) {

                for ( let i = 0; i < files.length; i++ ) {

                    let json = utils.readJSON( files[ i ], utf8 );

                    json = Object.assign( {}, defaultPage, json );

                    json.slug = "product/" + utils.makeSlug( path.basename( files[ i ], ".json" ) );
                    json.body = template.render( productTemplate, json );

                    utils.createFile( "../www/pages/" + json.slug + ".json", JSON.stringify( json ), true );

                }

                resolve();

            } );

        } );

    }

};