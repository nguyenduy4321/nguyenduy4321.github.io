
function myinit(){
	// init value
	const PI = 3.141592653589793;
	var sweight=0;
	var diameter=0;
	var diameter_unit=-1;
	var length=0;
	var length_unit=-1;
	var quantity=0;
	var price=0;	
	var price_unit=-3;	
	var weight=0;
	var weight_unit=-3;
	var total_weight=0;
	var total_weight_unit=-3;
	var total_price=0;
	function update() {
		$("#metal_material_value").val($("#metal_material").val());
		sweight=parseFloat($("#metal_material_value").val());
		diameter=parseFloat($("#diameter_value").val());
		length=parseFloat($("#length_value").val());
		quantity=parseInt($("#quantity_value").val());
		console.log(quantity);
		price=parseInt($("#price_value").val());
		
		weight=(Math.pow(diameter*Math.pow(10,diameter_unit),2)/4*PI*(length*Math.pow(10,length_unit)))*sweight*Math.pow(10,weight_unit);
		
		total_weight=(Math.pow(diameter*Math.pow(10,diameter_unit),2)/4*PI*(length*Math.pow(10,length_unit)))*sweight*Math.pow(10,total_weight_unit)*quantity;
		
		total_price=(Math.pow(diameter*Math.pow(10,diameter_unit),2)/4*PI*(length*Math.pow(10,length_unit)))*sweight*quantity*price*Math.pow(10,price_unit);
		
		if (isNaN(weight)) {
			weight=null;
			$("#weight_value").addClass("bg-warning");
			$("#weight_value").removeClass("bg-success");
			$("#weight_value").removeClass("text-white");
		} else {
			$("#weight_value").removeClass("bg-warning");
			$("#weight_value").addClass("bg-success");
			$("#weight_value").addClass("text-white");
		}
		
		if (isNaN(total_weight)) {
			total_weight=null;
			$("#total_weight_value").addClass("bg-warning");
			$("#total_weight_value").removeClass("bg-success");
			$("#total_weight_value").removeClass("text-white");
		} else {
			$("#total_weight_value").removeClass("bg-warning");
			$("#total_weight_value").addClass("bg-success");
			$("#total_weight_value").addClass("text-white");
		}
		if (isNaN(total_price)) {
			total_price=null;
			$("#total_price_value").addClass("bg-warning");
			$("#total_price_value").removeClass("bg-success");
			$("#total_price_value").removeClass("text-white");
		} else {
			$("#total_price_value").removeClass("bg-warning");
			$("#total_price_value").addClass("bg-success");
			$("#total_price_value").addClass("text-white");
		}
		
		$("#weight_value").val(weight);
		$("#total_weight_value").val(total_weight);
		$("#total_price_value").val(total_price);
	};
	
	$("#diameter_unit").on("change",function(){
		if($(this).val()=="m") diameter_unit=2;
		else if($(this).val()=="cm") diameter_unit=0;
		else if($(this).val()=="mm") diameter_unit=-1;
	});
	$("#length_unit").on("change",function(){
		if($(this).val()=="m") length_unit=2;
		else if($(this).val()=="cm") length_unit=0;
		else if($(this).val()=="mm") length_unit=-1;
	});
	$("#price_unit").on("change",function(){
		if($(this).val()=="/kg") price_unit=-3;
		else if($(this).val()=="/g") price_unit=0;
	});
	$("#weight_unit").on("change",function(){
		if($(this).val()=="kg") weight_unit=-3;
		else if($(this).val()=="g") weight_unit=0;
	});
	$("#total_weight_unit").on("change",function(){
		if($(this).val()=="kg") total_weight_unit=-3;
		else if($(this).val()=="g") total_weight_unit=0;
	});
	$(document).on("change",update);
};

$(document).ready(function(){
	myinit();
	$("#metal_material_value").val($("#metal_material").val());
});