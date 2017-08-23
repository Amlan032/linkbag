$(document).ready(function(){
	$(".link").on("click",function(){
		var l = $(this).find("#ll").text().substring(7);
		if(l.substring(0,4)=="http"){
			window.open(l);
		}
		else{
			var olink = "http://"+l;
			window.open(olink);
		}
	})

	$(".link").hover(function(){
		$(this).toggleClass("color");
	})

	$(".boom").click(function(){
		$.post("/delete",{params : {"name" : $(this).prev().find("#ll").text().substring(7)}});
		location.reload();
		});
	
});
