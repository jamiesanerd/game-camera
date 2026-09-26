# Game Camera

I've been fascinated by the Game Boy Camera since I first got one and spent like
weeks of my life trying to beat that space invaders game. This is my attempt to
make some video filters that let you play around with it in your browser so I
can take pictures of my cats with it whenever I want. I've gone for accuracy and
also adding a bunch of extra stuff I wish I could have done with the original.

The color compositing mode is an attempt to apply the three color processing
method to the monochromatic capture. Ghosting is expected in video mode as each
color is captured frame by frame in sequence.

There’s a bunch of other little things in there and I don’t want to keep writing
so just try it out.

## Run it

Serve this folder with any static web server, for example:

    python3 -m http.server

Then open http://localhost:8000 and click **Camera on**. The camera only works on localhost or HTTPS, and the page won't load if you open `index.html` straight from the disk.

## License

Copyright (C) 2026 Jamie

The procedure in `camera.js` is based on [Game Boy Camera Faker](https://github.com/Raphael-Boichot/Game-Boy-Camera-Faker) by Raphael Boichot. Game Boy Camera Faker has the GNU General Public License version 3. This program has the same license.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See `LICENSE.txt` for the full license.
