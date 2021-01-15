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

        product.slug = utils.makeSlug(product.Name);
        product.photo = product.slug + ".jpg";

        product.Reviews = tranformReviews( product.Reviews );

        ret.push( product );
    }

    return ret;

}

module.exports = {

    buildCategoryPages: function ( defaultPage ) {

        return new Promise( function ( resolve, reject ) {

            let categories = utils.readJSON("../www/api/home-categories.json");

            for (let i = 0; i < categories.length; i++) {

                let category = categories[i];

                category = Object.assign({}, defaultPage, category);

                category.slug = "category/" + utils.makeSlug(category.Name);

                category.Products = transformProducts(category.Products || category.Related);

                category.body = template.render(categoryTemplate, category);

                utils.createFile("./config/pages/" + category.slug + ".json", JSON.stringify(category), true);

            }

            resolve();

        } );

    }

};