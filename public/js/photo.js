$(function(){
    // load the image information from the database
    $.get('/api/images',(data)=>{
        let html = '';
        //build a card for each image
        for (var i=0; i<data.length; i++) {
            html += '<div class="card border-success mt-3">\n ' +
                '<img class="card-img-top" src="images/' + 
                data[i].filename + '"> \n' + 
                '<div class="card-body">\n' +
                    '<h5 class="card-title">' +
                    data[i].photo_name + '</h5>\n' +
                    '<p class="card-text">Album: ' +
                    data[i].album + '</p>\n' +
                '</div>\n</div>'; 
        }
        $('#imageArea').html(html);
        console.log(html);
    });
});