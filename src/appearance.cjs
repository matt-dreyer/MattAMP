const APPEARANCES=['modern','retro','apple2'];
function appearance(value={}){return APPEARANCES.includes(value.appearance)?value.appearance:value.retro===true?'retro':'modern';}
module.exports={APPEARANCES,appearance};
