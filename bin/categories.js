const utils = require( "./utils" ),
    fs = require( "fs" ),
    path = require( "path" ),
    glob = require( "glob" ),
    template = require( "mustache" ),
    utf8 = "utf-8",
    categoryTemplate = fs.readFileSync( "../www/html/templates/category.template.html", utf8 );

function tranformReviews( reviews ) {

    let ret = [];

    for ( let index = 0; index < reviews.length; index++ ) {

        const review = reviews[ index ];

        ret.push( {
            "rating": Math.floor( Math.random() * Math.floor( 5 ) ),
            "review": review.trim()
        } );

    }

    return ret;

}

function transformProducts( products ) {

    if ( !products || !products.length ) {
        return [];
    }

    let ret = [];

    for ( let index = 0; index < products.length; index++ ) {

        const product = products[ index ];

        product.Reviews = tranformReviews( product.Reviews );

        ret.push( product );
    }

    return ret;

}

module.exports = {

    buildCategoryPages: function ( defaultPage ) {

        return new Promise( function ( resolve, reject ) {

            glob( "../www/api/categories/*.json", function ( er, files ) {

                for ( let i = 0; i < files.length; i++ ) {

                    let json = utils.readJSON( files[ i ], utf8 );

                    json = Object.assign( {}, defaultPage, json );

                    json.slug = "category/" + utils.makeSlug( json.Name );

                    json.body = template.render( categoryTemplate, json ).trim()
                        .replace( /\r\n/g, "" ).replace( /  /g, " " );

                    json.Products = transformProducts( json.Products || json.Related );

                    utils.createFile( "../www/pages/" + json.slug + ".json", JSON.stringify( json ), true );

                }

                resolve();

            } );

        } );

    }

};