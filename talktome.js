var $form = $('form#act'),
    urll = 'https://script.google.com/macros/s/AKfycbxY-k6zjt2pOlpyzypSARyfjUHlGDfl_4ovnKalvbi9vRYyKTfccSC4TtuA_XoG0aOG5A/exec'

$('#submit-form').on('click', function(e) {
	e.preventDefault();
	var jqxhr = $.ajax({
		url: urll,
		method: "GET",
		dataType: "json",
		data: $form.serialize()
	});
	jqxhr.done(function(data){
		console.log(data);
		alert("I got you");
		$('form').find("input[type=text], textarea").val("");
	});
})