var g_lines;
var g_lines_ptr;
var AddVelocityAngle;
var SetRuntimeConfig;
var GetLines;
var Spawn;
var TogglePause;
var g_tmp_canvas;
var kScale = 4;
var g_coal = true;
var g_nx = 32

function GetExtraConfig() {
  return `
set double rho1 1
set double mu1 0.0004
set double rho2 10
set double mu2 0.004
set vect gravity 0 -5
set double hypre_symm_tol 1e-2
set int hypre_symm_maxiter 20
set int hypre_symm_miniter 5
set double visvel 0
set double visvf 0.7
set double visvort 0.025
set int visinterp 1
set int sharpen 1
set double dtmax 0.1
set double sigma 4
set int nsteps 2
set double cfl 0.9
set double cflvis 0.125
set double cflsurf 2
set double coalth 0.1
`
}

function SetCoal(flag) {
  g_coal = flag;
  Module.ccall('SetCoal', null, ['number'], [flag]);
}

function SetExtraConfig(conf) {
  Module.ccall('SetExtraConfig', null, ['string'], [conf]);
}

function SetRuntimeConfig(conf) {
  Module.ccall('SetRuntimeConfig', null, ['string'], [conf]);
}

function SetSigma(sigma) {
  SetRuntimeConfig("set double sigma " + sigma);
}

function SetMu(mu) {
  SetRuntimeConfig("set double mu1 " + mu);
  SetRuntimeConfig("set double mu2 " + (mu * 10));
}

function Init(nx) {
  g_nx = nx
  conf = GetExtraConfig()
  if (g_coal) {
    conf += "set int coal 1\n";
  } else {
    conf += "set int coal 0\n";
  }
  SetExtraConfig(conf);
  Module.ccall('SetMesh', null, ['number'], [nx])
  Spawn(0.5, 0.5, 0.2);
  SetSigma(window.range_sigma.value);
  SetMu(window.range_mu.value);
}


function Draw() {
  let canvas = Module['canvas'];
  let ctx = canvas.getContext('2d');
  ctx.drawImage(g_tmp_canvas, 0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 3;
  ctx.strokeStyle="#000000";
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  g_lines = new Uint16Array(Module.HEAPU8.buffer, g_lines_ptr, g_lines_max_size);
  let size = GetLines(g_lines.byteOffset, g_lines.length);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "black";
  for (let i = 0; i + 3 < size; i += 4) {
    ctx.beginPath();
    ctx.moveTo(g_lines[i], g_lines[i + 1]);
    ctx.lineTo(g_lines[i + 2], g_lines[i + 3]);
    ctx.stroke();
  }
}

function PostRun() {
  window.checkbox_coal.checked = true;
  g_lines_max_size = 10000;
  g_lines_ptr = Module._malloc(g_lines_max_size * 2);
  TogglePause = Module.cwrap('TogglePause', null, []);
  Spawn = Module.cwrap('Spawn', null, ['number', 'number', 'number']);
  AddVelocityAngle = Module.cwrap('AddVelocityAngle', null, ['number']);
  GetLines = Module.cwrap('GetLines', 'number', ['number', 'number']);

  let canvas = Module['canvas'];
  g_tmp_canvas = document.createElement('canvas');
  g_tmp_canvas.width = canvas.width / kScale;
  g_tmp_canvas.height = canvas.height / kScale;

  let keydown = function(ev){
    if (ev.key == ' ') {
      TogglePause();
      ev.preventDefault();
    }
  };
  let keyup = function(ev){
    if (ev.key == ' ') {
      ev.preventDefault();
    }
  };
  let mouseclick = function(ev){
    let x = ev.offsetX / canvas.width;
    let y = 1 - ev.offsetY / canvas.height;
    Spawn(x, y, 0.1);
  };

  window.addEventListener('keydown', keydown, false);
  window.addEventListener('keyup', keyup, false);
  canvas.addEventListener('click', mouseclick, false);
  Init(32);
}

var Module = {
  preRun: [],
  postRun: [function (){ PostRun();}],
  print: (function() {
    var element = document.getElementById('output');
    if (element) element.value = '';
    return function(text) {
      if (arguments.length > 1) {
        text = Array.prototype.slice.call(arguments).join(' ');
      }
      console.log(text);
      if (element) {
        element.value += text + "\n";
        element.scrollTop = element.scrollHeight;
      }
    };
  })(),
  printErr: function(text) {
    if (arguments.length > 1) {
      text = Array.prototype.slice.call(arguments).join(' ');
    }
    console.error(text);
  },
  canvas: (function() { return document.getElementById('canvas'); })(),
  setStatus: function(text) {},
};
