$(() => {
    //handle login
    $('#login_submit').on("submit", (e) => {
        e.preventDefault();

        let loginData = {
            uid: $("#uid").val(),
            password: $("#password").val()
        }
        
        $.ajax({
            type: "POST",
            url: "api/auth",
            data: JSON.stringify(loginData),
            contentType: "application/json",
            statusCode: {
                401: (resObj, textStatus, jqXHR) => {
                    alert("Bad username or password.")
                }
            }
        })

        .fail((jqXHR) => {
            if(jqXHR.status != 401) {
                alert("Error: "+jqXHR.status+"\n" + jqXHR.statusText); 
            }
        })
        .done((data) => {
            window.location.href = "../dashboard.html";
            window.localStorage.setItem("token", data.token);
        });

    });

    //handle logout
    $("#logout").on("click", (e) => {
        window.localStorage.removeItem("token");
        window.location.href = "http://localhost:3000";
    });

    //handle signup
    $('#signupForm').on("submit", (e) => {
        e.preventDefault();

        let reqData = {uid: $("#signup_uid").val(),
                       password: $("#signup_password").val(),
                       full_name: $("#signup_fullname").val()};
        $.ajax({
            type: "POST",
            url: "api/user",
            data: JSON.stringify(reqData),
            contentType: "application/json",
            statusCode: {
                201: (resObj, textStatus, jqXHR) => {
                    alert("Successfully created new account.")
                },
                409: (resObj, textStatus, jqXHR) => {
                    alert("Username's already taken");
                }    
            }
        })
        .fail((jqXHR) => {
            if(jqXHR.status != 409) {
                alert("Error: "+ jqXHR.status + "\n" + jqXHR.statusText);
            }
        })
        .done((data) => {
            window.location.href = "http://localhost:3000";
        })
        ;


    });

    //Change Password
    $('#changePassword').on("submit", (e) => {
        e.preventDefault();
        let token = window.localStorage.getItem("token");
        let reqData = {password: $("#newPassword").val()};

        $.ajax({
            type: "POST",
            url: "api/user/change",
            data: reqData,
            headers: {"X-Auth": token},
            contentType: "application/x-www-form-urlencoded",
            statusCode: {
                200: (resObj, textStatus, jqXHR) => {
                    alert("Successfully changed password.")
                },
                304: (resObj, textStatus, jqXHR) => {
                    alert("New password is the same as the old password. Please try again.");
                }    
            }
        })
        .fail((jqXHR) => {
            if(jqXHR.status != 409) {
                alert("Error: "+ jqXHR.status + "\n" + jqXHR.statusText);
            }
        });


    });

    // Delete account
    $("#deleteAccount").on("click", (e) => {
        e.preventDefault();
        let token = window.localStorage.getItem("token");

        $.ajax({
            type: "GET",
            url: "api/user/delete?token=" + token,
            dataType: "html",
            statusCode: {
                400: (resObj, textStatus, jqXHR) => {
                    alert("Error deleting user.");
                },
                200: (resObj, textStatus, jqXHR) => {
                    alert("Successfully deleted usesr.");
                }
            }
        })
        .fail((jqXHR) => {
            if ((jqXHR.status != 401) || jqXHR.status != 404) {
                alert("Server Error: Try again later.");
            }
        })
        .done((data) => {
            // Delete token and log out
            window.localStorage.removeItem("token");
            window.location.href = "http://localhost:3000";
        })

    })

    // get photos page
    $("#photoPage").on("click", (e) => {
        let pageNo = 1260;
        let token = window.localStorage.getItem("token");
        $.ajax({
            type: "GET",
            headers: {"X-Auth": token},
            url: "api/page?pageId=" + pageNo,
            dataType: "html",
            statusCode: {
                401: (resObj,textStatus,jqXHR) => {
                    alert("Access unauthorized.");
                },
                404: (resObj,textStatus,jqXHR) => {
                    alert("Page not found.");
                }
            }
        })
        .fail((jqXHR) => {
            if ((jqXHR.status != 401) || jqXHR.status != 404) {
                alert("Server Error: Try again later.");
            }
        })
        .done((data) => {
            // Load image into page
            data = data.trim();
            console.log(data);
            $("#myPhotos").html(data);
            console.log("Page loaded.");

            loadImage();
            return false;
        })
    });

    $('#uploadPhoto').on("submit", (e) => {
        e.preventDefault();
        let token = window.localStorage.getItem("token");

        var form = new FormData();
        form.append("photo", $('#photo')[0].files[0],);
        form.append("photoName", $('#photoName').val());
        form.append("album", $('#album').val());
        form.append("description", $('#description').val());
        form.append("sspeed", $('#sspeed').val());
        form.append("iso", $('#iso').val());
        form.append("focalLength", $('#focalLength').val());
        form.append("cameraType", $('#cameraType').val());

        var settings = {
            url: "api/images",
            method: "POST",
            mimeType: "multipart/form-data",
            headers: {
                "X-Auth": token
            },
            data: form,
            processData: false,
            contentType: false
        };

        $.ajax(settings).done(function (response) {
            window.location.href = "../dashboard.html";
        });

    });

    

})
