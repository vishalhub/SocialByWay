Deployement Process:

Pre-Requisites:

Ruby >= 1.9.2
Rails >= 3.0.0

/* To get the gem sets installed */
bundle install

Running the build:


rake socialbyway:build

/* To toggle the creation of the docs */
rake socialbyway:build[false] 

/* To create the build with version number */
rake socialbyway:build[false,"1.1"] 

/* To have both docs and version number as part of build */
rake socialbyway:build[true,"1.1"] 


Once the packaging is done,

Site -> build -> socialbyway(if no version number) -> socialbyway.zip

Site -> build -> socialbyway(version number) -> socialbyway(version number).zip



