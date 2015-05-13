#! /usr/bin/env python
# -*- coding: utf-8 -*-

import os
import json
import datetime
import redis
import pickle
from tornado import httpserver, web, websocket, ioloop, options


r = redis.Redis(host='localhost', port=6379, db=0)


class ChatWebSocket(websocket.WebSocketHandler):
    """Class for Web Socket"""
    connections = set()

    def check_origin(self, origin):
        return True

    def open(self):
        """Call when the websocket opens"""
        ChatWebSocket.connections.add(self)
        self.get_past_message()
        print "Websocket opened"

    def on_message(self, message):
        jmsg = json.loads(message)
        d = datetime.datetime.today()
        jmsg[u'time'] = u'%s:%s:%s' % (d.hour, d.minute, d.second)
        self.check_message(jmsg)
        for connection in ChatWebSocket.connections:
            try:
                connection.write_message(jmsg)
            except:
                self.connections.remove(connection)

    def on_close(self):
        ChatWebSocket.connections.remove(self)

    def check_message(self, message):
        if message['type'] == 'chat':
            if r.llen('msg') > 20:
                r.lpop('msg')
            r.rpush('msg', pickle.dumps(message))

    def get_past_message(self):
        for message in r.lrange('msg', 0, 20):
            self.write_message(pickle.loads(message))


class MainHandler(web.RequestHandler):
    """Class for chat page"""
    def get(self):
        self.render('chat.html')


class Application(web.Application):
    """Override web.Application class"""
    def __init__(self):
        handlers = [
                    (r'/', MainHandler),
                    (r'/websocket', ChatWebSocket),
                   ]
        # set templates directiory
        settings = dict(
                        debug=True,
                        template_path=os.path.join(os.path.dirname(__file__), "templates/"),
                        static_path=os.path.join(os.path.dirname(__file__), "static/"),
                        )
        # override web.Application.__init__
        web.Application.__init__(self, handlers, **settings)


def main():
    # for logging(see terminal or console)
    options.parse_command_line()
    # create http server
    http_server = httpserver.HTTPServer(Application())
    # specify port number
    http_server.listen(8888)
    # server start
    ioloop.IOLoop.instance().start()


if __name__ == '__main__':
    main()


# End of Line.
