var socket = io.connect();

$(document).ready(function() {
 
 socket.on('ledStatOn', function(ledStatOn) {
    	console.log('Received LED status ' + ledStatOn);
	});   
    
$("input:radio[name=ledStat]").click(function() {
    var val = $('input:radio[name=ledStat]:checked').val();
    console.log(val);
        socket.emit('ledStatOn', val);
});

    
	socket.on('tempData', function(tempData) {
        $('#logger').text('Web server connected.');
		$('#logger').css('color', 'green');
		console.log("Server Connected");
        console.log(tempData);
        $('#tempData').html(tempData);
        socket.on('disconnect', function() {
			// visually disconnect
			$('#logger').text('Web server disconnected.');
			$('#logger').css('color', 'red');
		});
    
	});
});