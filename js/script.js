var nav =            [{"url":"/projects", "text": "Projects"},
		   {"url": "http://linkedin.com/in/bethanycrane", "text": "LinkedIn"},
		   {"url": "http://github.com/abethcrane", "text": "Github"}];

var displayTemplate = function(template, element, data) {
    //Replace the body section with the new code.
    $(element).append(template(data));
}

var displayTemplateAndResizeImages = function(template, element, data) {
        displayTemplate(template, element, data);
        $(".flickr img").load(function() {
            $(this).maxSide({maxSide:"300"});
        });
}

function getTemplateAjax(path, element, dict, callback) {
        var source;
        var template;

        $.ajax({
                url: path,
                success: function(data) {
                    //Get the Template and compile it
                    source    =  data;
                    template  = Handlebars.compile(source);

                    //execute the callback if passed
                    if (callback) {
                        callback(template, element, dict);
                   }
            }
        });
    }

Handlebars.registerHelper("hasTitle", function(feedName, options) {
    var fnTrue=options.fn, fnFalse=options.inverse;
    return (feedName == 'flickr' || feedName == 'instagram' || feedName == 'medium') ? fnTrue() : fnFalse();
});

$(document).ready(function() {
    $('.resize').css('height', window.innerHeight);
    $(window).resize(function() {
        $('.resize').css('height', window.innerHeight);
        $('.content').css('height', "100%");
    });
});

