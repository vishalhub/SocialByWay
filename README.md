SocialByWay Social Plugin Library
=================================

SocialByWay is javascript based social plugin library for the site and application developers.
It provides a common set of interfaces for the application developers who would want to develop their own widgets connecting and using the social sites like Facebook, Flickr, LinkedIn

Want to contribute to SocialByWay APIs? Please read `CONTRIBUTING.md`.


Installation
------------

Use git to clone the [official JSDoc repository](https://github.com/Imaginea/SocialByWay):

    git clone git@github.com:Imaginea/SocialByWay.git

Alternatively, you can download a .zip file for the
[latest development version](https://github.com/Imaginea/SocialByWay/archive/master.zip)
or a [previous release](https://github.com/Imaginea/SocialByWay/tags).


Dependencies
------------

SocialByWay uses Ruby >= 1.9.2 and Rails >= 3.0.0


Build
--------------------
Run the command to install dependencies
    bundle install

Building the SocialByWay Library. It can take 3 arguments

    rake socialbyway:build["GENERATE_DOCS | True","VERSION","PATH_TO_SITE"]

To run the build without documentation

    rake socialbyway:build[false]

To have both docs and version number as part of build

    rake socialbyway:build[true,"1.1"]

To build and deploy the library on the site

    rake socialbyway:build[true,"1.1","/home/site/"]


Once the packaging is done,

   Site > build > socialbyway(version number) > socialbyway(version number).zip


See Also
--------

Project Site: <http://www.socialbyway.com/>
Project Documentation: <https://www.socialbyway.com/document.html>
JSDoc User's Group: <http://groups.google.com/group/socialbyway-users>
Project Announcements: <http://twitter.com/socialbyway>


License
-------

SocialByWay is copyright (c) 2012-2013.

SocialByWay is free software, licensed under the MIT License. See
the file `LICENSE.md` in this distribution for more details.





