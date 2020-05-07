function loadImage() {
    let token = window.localStorage.getItem("token");

    let url = "api/images?token=" +token;
    console.log("Image search url: "+url);

    // load the image information from the database
    $.get(url,(data)=>{
        console.log(data);
        let html = '<div class="card border-success mt-3">\n' + 
                    '<h2 class="card-header">Recent Images </h2>\n' +
                    '<div class="card-body">\n';

        //put the image thumbnails in a single card 
        for (var i=0; i<data.length; i++) {
            html += '<img class="thumbnail" src="images/'+
                    data[i].path +'/thumbs/' + data[i].filename+'">\n';
                    console.log("Adding image: " + data[i].filename);
        }
        
        
        html += '</div>\n</div>\n';
        console.log("Full html: " + html);

        $('#imageArea').html(html);

    })
    .fail((jqXHR) => {
        alert("Image Query Failed: " + jqXHR.statusText);
    })
};