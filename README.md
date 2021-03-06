# Frameripper

Frameripper is a client/server app to extract frames from videos using ffmpeg. You use it by starting the server and
configuring the top-level video and image directories to use, and then you serve the client webapp on the network.

The server app is designed to handle connections from only one client at a time. If you want to use the app from multiple
clients then spawn additional server instnaces and point them there.

## Features
Client:
- Extracts all video frames to JPG for inspection
- Lets you input one-based frame numbers to extract their PNG frames
- Customizeable file name prefix
- Displays progress of ffmpeg extractions
- Configurable frame offset for the rare case the video frames are off by one
- Add and remove projects

Server:
- Arbitrary characters supported in video name, by virtue of LevelDB
- JPG and PNG frames extracted to separate subfolders, and from there one subfolder for each project with prefix as the name
- For security, selectively allow clients to connect to the server using a configurable CORS origins list
- Comprehensive JSON-oriented logging

## Usage

1. Clone this repositiory
2. Run `npm install -g serve` to install the server package. It's needed to run the client app.
3. Open a terminal and run `npm run server --jpgpath <ROOT-FOLDER-OF-JPG-OUTPUT> --pngpath <ROOT-FOLDER-OF-PNG-OUTPUT> --videopath <PATH-TO-VIDEOS> --origins <LIST-OF-DOMAINS-SEPARATED-BY-COMMAS>`. If necessary you can change the listening port with `--port`.
4. In another terminal run `npm run-script build` to compile the client app, then run `serve -l tcp://host:port build` to run the client app on that host and port. Make sure it's in the allowed server CORS origins.

The images will be generated on the server. To view them on a headless server, use self-hosted image gallery software. For that I use [Piwigo](https://piwigo.org/get-piwigo).

## Known issues
- If project creation XMLHTTPRequest fails, it takes you to the select screen with empty data. Treat it as failure.
- Similarly for settings page.
- Renaming projects is not supported at this time.

