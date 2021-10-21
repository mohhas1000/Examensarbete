// Lyssna på en specifik värd via HOST-miljövariabeln
var host = process.env.HOST || '0.0.0.0';
// Lyssna på en viss port via miljövariabeln PORT
var port = process.env.PORT || 3050;

var cors_proxy = require('cors-anywhere'); // inkluderar CORS

cors_proxy.createServer({ //skapar en cors-anywhere-server
    originWhitelist: [], // tillåtter alla ursprung (origins)
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, function() {
    console.log('Running CORS Anywhere on ' + host + ':' + port); // Meddelande för att se var den lokala servern körs. 
});

/*                                          -------------- Licence --------------

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                                        
                                            Copyright (C) 2013 - 2021 Rob Wu rob@robwu.nl

*/

