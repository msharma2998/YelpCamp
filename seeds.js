var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment   = require("./models/comment");
 
var data = [
    {
        name: "Tso Moriri Lake, Ladakh", 
        image: "https://www.holidify.com/images/cmsuploads/compressed/640px-Tsomoriri_Lake_DSC4010_20190212171119.jpg",
        description: "Tsomoriri Lake is the highest lake in the world and located in Ladakh. Camping here is the experience of a lifetime. The lake is completely frozen during the winters and is an excitingly unique thing to witness. The best time to camp here is during May to September and it is simply wonderful to spend time in the decorated tents. You can trek in the nearby Ladakh region and witness the mesmerizing sunset at the lake. The best part is that the tents are comfortable with electricity supply."
    },
    {
        name: "Camp Exotica, Kullu", 
        image: "https://www.holidify.com/images/cmsuploads/compressed/tent-1208201_1920_20190212172038.jpg",
        description: "The Camp Exotica is a perfect weekend getaway option located in Kullu in the Manali district of Himachal Pradesh. The accommodation provided is world class and the tents simply leave you connecting with nature like never before. The location of these tents is such that it gives a panoramic view of the surrounding mountains. The food provided is of fine quality and the incredible view will simply leave you in awe of this adventure. Make sure to take out time for this pleasure full camping trip."
    },
    {
        name: "Mehar, Jaisalmer", 
        image: "https://www.holidify.com/images/cmsuploads/compressed/25439743351_5e7c669338_z_20190212183635.jpg",
        description: "For those of you looking for a stay in the deserts of Rajasthan, Mehar is the perfect place to plan your stay. Located near the dunes, the Mehar camp lets you experience the arid deserts of Jaisalmer from up close. It has been defined by tourists as a place to eat, drink and be merry! The camps have all the facilities to make it a comfortable stay and have your day packed with fun-filled activities. The main advantage of this place is its proximity to touristy places like Kuldhara, Damodara, Lodhruva and the other abandoned villages."
    }
]
 
function seedDB(){
   //Remove all campgrounds
   Campground.remove({}, function(err){
        if(err){
            console.log(err);
        }
        console.log("removed campgrounds!");
        Comment.remove({}, function(err) {
            if(err){
                console.log(err);
            }
            console.log("removed comments!");
             //add a few campgrounds
            data.forEach(function(seed){
                Campground.create(seed, function(err, campground){
                    if(err){
                        console.log(err)
                    } else {
                        console.log("added a campground");
                        //create a comment
                        Comment.create(
                            {
                                text: "This place is great, but I wish there was internet",
                                author: "Homer"
                            }, function(err, comment){
                                if(err){
                                    console.log(err);
                                } else {
                                    campground.comments.push(comment);
                                    campground.save();
                                    console.log("Created new comment");
                                }
                            });
                    }
                });
            });
        });
    }); 
}
 
module.exports = seedDB;

