/*Nome: Gabriel de Freitas Garcia
Objetivo: Fazer um programa em node.js que receba um arquivo input.csv, processe os dados e imprima em um arquivo outpu.json*/
function main(){
  var fs = require("fs")
  var arquivo,linhas,aluno
  var alunos = []
  var header = []
  arquivo = fs.readFileSync("input.csv","utf-8")
  linhas = arquivo.split(/\r?\n/)
  header = separar(linhas[0])
  linhas.splice(0,1)
  for (var i = 0; i < linhas.length;i++){
    aluno = cria_objeto(linhas[i],header)
    alunos = coloca(alunos,aluno)
  }
  fs.writeFileSync("output.json",JSON.stringify(alunos,null,1),"utf-8")
  //console.log(JSON.stringify(alunos,null,4))
}
function separar(string){
  var aspas1 = /\".+/, aspas2 = /.+\"/
  var texto = string.split(",")
  for (var i = 0; i < texto.length; i++){
    if (aspas1.test(texto[i])){
      while(true){
        if (i === (texto.length)-1){
          break
        }
        if (aspas2.test(texto[i+1])){
          texto[i] = texto[i] + texto[i+1]
          texto.splice(i+1,1)
          texto[i] = texto[i].substr(1).slice(0, -1)
          break
        } else {
          texto[i] = texto[i] + texto[i+1]
          texto.splice(i+1,1)
        }
      }
    }
  }
  return texto
}
function cria_objeto(aluno,header){
  const PNF = require('google-libphonenumber').PhoneNumberFormat;
  const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()
  var name = /fullname/i, eid = /eid/i, num = /\d+/,classe = /class/i, sala = /sala \d+/i, correio = /email/i
  var email = /\w+@\w+\.[a-z]+\.?[a-z]{0,2}/, telefone = /phone/i, invisivel = /invisible/i, ver = /see_all/i, letra = /[a-zA-Z]+/,especiais = /[();:!#$*&£\[\]\{\}+=]+/
  var modelo, endereço
  modelo = {
    fullname : "",
    eid: "",
    classes : [],
    addresses: [],
    invisible: false,
    see_all: false
  }
  aluno = separar(aluno)
  for (var i = 0; i < header.length; i++){
    endereço = {
      type: "",
      tags: [],
      address: ""
    }
    endereço.tags = []
    if (aluno[i] === ""){
      continue
    }
    if (name.test(header[i])){
      modelo.fullname = aluno[i]
    } else if (eid.test(header[i])){
      modelo.eid = num.exec(aluno[i])[0]
    } else if (classe.test(header[i])){
        modelo = adicionar(endereço,aluno[i],sala,modelo,1)
    } else if (correio.test(header[i])){
      if (especiais.test(aluno[i])){
        continue
      }
      endereço.type = "email"
      var tags = header[i].split(" ")
      for (var j = 0; j < tags.length; j++){
        if (correio.test(tags[j])){
          continue
        } else{
          endereço.tags.push(tags[j])
        }
      }
      console.log("batata")
      modelo = adicionar(endereço,aluno[i],email,modelo,2)
    } else if (telefone.test(header[i])){
      if ((letra.test(aluno[i]))){
        continue
      }
      endereço.type = "phone"
      var tags = header[i].split(" ")
      for (var j = 0; j < tags.length; j++){
        if (telefone.test(tags[j])){
          continue
        } else{
          endereço.tags.push(tags[j])
        }
      }
      var number = phoneUtil.parseAndKeepRawInput(aluno[i], 'BR')
      if (phoneUtil.isValidNumber(number)){
        endereço.address = phoneUtil.format(number, PNF.E164).replace("+","")
        modelo.addresses.push(endereço)
      }
    } else if (invisivel.test(header[i])){
      if ((aluno[i] == true || aluno[i] == "yes" || num.test(aluno[i])) && (aluno[i] != 0 && aluno[i] !== "false" && aluno[i] != "no" && aluno[i] != false)){
        modelo.invisible = true
      }
    } else if (ver.test(header[i])){
      if ((aluno[i] == true || aluno[i] == "yes" || num.test(aluno[i])) && (aluno[i] != 0 && aluno[i] !== "false" && aluno[i] != "no" && aluno[i] != false)){
        modelo.see_all = true
      }
    }
  }
  return modelo
}
function adicionar(endereço,aluno,regex,modelo,tipo){
  while (regex.test(aluno)){
    var corresponde = regex.exec(aluno)[0]
    console.log(corresponde)
    if (tipo === 1){
      modelo.classes.push(corresponde)
    } else {
      modelo = poe(endereço,modelo,corresponde)
      for (var i = 0; i < modelo.addresses.length; i++){
        console.log(modelo.addresses[i])
      }
    }
    aluno = aluno.replace(corresponde,"")
  }
  return modelo
}
function coloca(lista,aluno){
  var i ,j
  for (i = 0; i < lista.length; i++){
    if (lista[i].eid === aluno.eid){
      for (j = 0; j < aluno.classes.length; j++){
        if (!busca(aluno.classes[j],lista[i].classes)){
          lista[i].classes.push(aluno.classes[j])
        }
      }
      for (j = 0; j < aluno.addresses.length; j++){
        if (!busca(aluno.addresses[j],lista[i].addresses)){
          lista[i].addresses.push(aluno.addresses[j])
        }
      }
      if (lista[i].invisible === true || aluno.invisible === true){
        lista[i].invisible = true
      }
      if (lista[i].see_all === true || aluno.see_all === true){
        lista[i].see_all = true
      }
      return lista
    }
  }
  lista.push(aluno)
  return lista
}
function busca(elemento,lista){
  var i
  for (i = 0; i < lista.length; i++){
    if (elemento == lista[i]){
      return true
    }
  }
  return false
}
function poe(endereço,modelo,email){
  endereço.address = email
  modelo.addresses.push(endereço)
  return modelo
}
main()
//Agradeço a Deus porque Ele sempre está comigo, morreu por mim, me salvou e cuidou de mim em cada momento de minha vida.
