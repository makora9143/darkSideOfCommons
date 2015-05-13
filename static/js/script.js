var buttonflg = false
var soundflg = false

Notification.requestPermission()

ws = new WebSocket("ws://localhost:8888/websocket");

var userName = 'ゲスト' + Math.floor(Math.random() * 100);
$('#username').append(userName);

ws.onopen = function() {
    $('#textbox').focus();
    ws.send(JSON.stringify({
        type: 'join',
        user: userName
    }));
};

ws.onmessage = function(message) {
    var data = JSON.parse(message.data);
    if (buttonflg == false) {
        if($('#notifyToggle').prop("checked")) {
            titlenotifier.add()
            $("#beep").get(0).play()
            notification = new Notification("新着メッセージがあります", {body: data.text, iconUrl: "https://t.pimg.jp/003/028/014/1/3028014.jpg", icon: 'https://t.pimg.jp/003/028/014/1/3028014.jpg'});
            setTimeout(function() {
              notification.close();
            }, 5000);
        }
    }
    buttonflg = false

    var item = $('<div/>').append(
                    $('<div/>').append(
                        $('<i/>').addClass('glyphicon glyphicon-user'),
                            $('<small/>').addClass('meta chat-time').append(data.time))
    );
    if (data.type == 'join') {
        item.addClass('alert alert-info')
        .prepend('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>')
        .children('div').children('i').after(data.user + 'が入室しました');
    } else if (data.type === 'chat') {
        item.addClass('well well-sm')
        .append($('<div/>').text(data.text))
        .children('div').children('i').after(data.user);
    } else if (data.type === 'defect') {
        item.addClass('alert alert-warning')
        .prepend('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>')
        .children('div').children('i').after(data.user + 'が退室しました');
    } else {
        item.addClass('alert alert-error')
        .children('div').children('i').removeClass('icon-user').addClass('icon-warning-sign')
        .after('不正なメッセージを受信しました');
  }
    $('#chat-history').prepend(item).hide().fadeIn(500);
};

textbox.onkeydown = function(event) {
  if (event.keyCode === 13 && textbox.value.length > 0) {
    buttonflg = true
    titlenotifier.reset()
    ws.send(JSON.stringify({
      type: 'chat',
      user: userName,
      text: textbox.value
    }));
    textbox.value = '';
  }
};

window.onbeforeunload = function() {
    ws.send(JSON.stringify({
        type: 'defect',
        user: userName,
    }));
    ws.close();
};

