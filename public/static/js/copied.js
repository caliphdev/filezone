var toCopy = document.getElementById( 'to-copy' ),
btnCopy = document.getElementById( 'copy' )
	
	btnCopy.addEventListener( 'click', function(){
	  toCopy.select()
	  if ( document.execCommand( 'copy' ) ) {
		  btnCopy.classList.add( 'copied' );
		 alert("Success Copy Link To Clipboard")
		 setTimeout( function(){
			btnCopy.classList.remove( 'copied' );
		  }, 2000 );
	  } else {
		console.info( 'document.execCommand went wrong…' )
	  }
	  return false;
	} );
