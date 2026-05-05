const songForm = document.querySelector("#songForm");
const songInput = document.querySelector("#songName");
const songWarning = document.querySelector("#songWarning");

const movieForm = document.querySelector("#movieForm");
const movieInput = document.querySelector("#movieName");
const movieWarning = document.querySelector("#movieWarning");

const loginForm = document.querySelector("#loginForm");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const loginWarning = document.querySelector("#loginWarning");

if(songForm){
  songForm.addEventListener("submit", function(event){
    const songValue = songInput.value.trim();

    if(songValue === ""){
      event.preventDefault();
      songWarning.textContent = "Please enter a song name before searching.";
      songInput.classList.add("input-error");
    }
    else{
      songWarning.textContent = "";
      songInput.classList.remove("input-error");
    }
  });

  songInput.addEventListener("input", function(){
    const songValue = songInput.value.trim();

    if(songValue !== ""){
      songWarning.textContent = "";
      songInput.classList.remove("input-error");
    }
  });
}

if(movieForm){
  movieForm.addEventListener("submit", function(event){
    const movieValue = movieInput.value.trim();

    if(movieValue === ""){
      event.preventDefault();
      movieWarning.textContent = "Please enter a movie name before searching.";
      movieInput.classList.add("input-error");
    }
    else{
      movieWarning.textContent = "";
      movieInput.classList.remove("input-error");
    }
  });

  movieInput.addEventListener("input", function(){
    const movieValue = movieInput.value.trim();

    if(movieValue !== ""){
      movieWarning.textContent = "";
      movieInput.classList.remove("input-error");
    }
  });
}

if(loginForm){
  loginForm.addEventListener("submit", function(event){
    const usernameValue = usernameInput.value.trim();
    const passwordValue = passwordInput.value.trim();

    if(usernameValue === "" || passwordValue === ""){
      event.preventDefault();
      loginWarning.textContent = "Both fields must be filled out.";
      usernameInput.classList.add("input-error");
      passwordInput.classList.add("input-error");
    }
    else{
      loginWarning.textContent = "";
      usernameInput.classList.remove("input-error");
      passwordInput.classList.remove("input-error");
    }
  });

  usernameInput.addEventListener("input", function(){
    clearLoginWarning();
  });

  passwordInput.addEventListener("input", function(){
    clearLoginWarning();
  });
}

function clearLoginWarning(){
  const usernameValue = usernameInput.value.trim();
  const passwordValue = passwordInput.value.trim();

  if(usernameValue !== "" && passwordValue !== ""){
    loginWarning.textContent = "";
    usernameInput.classList.remove("input-error");
    passwordInput.classList.remove("input-error");
  }
}