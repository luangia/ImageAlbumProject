$(function() {
    function login(username, password) {
        var requestData = { uid: username, password: password };

        $.post("api/auth", requestData, function(data) {
            if (data.token) {
                windows.localStorage.setItem("token", data.token);
            }
        })
    }

    $("#login_btn").click(function() {
        login($("#uid").val(), $("#password").val());
    });
})