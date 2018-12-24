/*Nome: Gabriel de Freitas Garcia
Objetivo: Fazer um programa em node.js que receba um arquivo input.csv, processe os dados e imprima em um arquivo outpu.json*/
function main(){ //função principal
  var fs = require("fs"); //módulo com funções para arquivos
  var arquivo,linhas,aluno;
  var alunos = [];
  var header = []; //variáveis usadas para guardar o arquivo, o arquivo separado em linhas, aluno provisoriamente, headers e a lista com os alunos
  arquivo = fs.readFileSync("input.csv","utf-8"); //lê a entrada sincronamente, pra não dar problema com as operações em paralelo
  linhas = arquivo.split(/\r?\n/); //quebra cada linha da entrada numa lista
  header = separar(linhas[0]); //separa o header num formato aproveitável
  linhas.splice(0,1); //retira o header da lista
  for (var i = 0; i < linhas.length;i++){
    if (linhas[i] == "" || linhas[i] == null || linhas[i] == undefined){
      continue; //se não houver nada neste elemento de linhas, passa pra próxima iteração
    }
    aluno = cria_objeto(linhas[i],header); //salva a linha num objeto
    if (aluno.classes.length == 1){
      aluno.classes = aluno.classes[0]; //Se houver apenas um aluno, transforma lista em string
    } else if (aluno.classes.length == 0){
      aluno.classes = ""; //Se não houver nenhum, transforma lista em string vazia
    }
    alunos = coloca(alunos,aluno); //Insere o aluno na lista alunos
  }
  if (alunos.length == 1){
    alunos = alunos[0]; //Se houver apenas um aluno. transforma em objeto
  } else if (alunos.length == 0){
    alunos = ""; //Se não houver nenhum, transforma em string vazia
  }
  fs.writeFileSync("output.json",JSON.stringify(alunos,null,1),"utf-8"); //Escreve no arquivo de saída, sincronamente, achei melhor não lidar com assincro por enquanto
  //console.log(JSON.stringify(alunos,null,4))
}
function separar(string){
  var aspas1 = /\".+/, aspas2 = /.+\"/; //Regex para expressões com aspas no começo e no final
  var texto = string.split(","); //Separa testo pelas vírgulas
  for (var i = 0; i < texto.length; i++){
    if (aspas1.test(texto[i])){ //Se começa com aspas
      while(true){
        if (i === (texto.length)-1){
          break; //Se for o último da lista quebra o laço
        }
        if (aspas2.test(texto[i+1])){ //Quando acha aspas no final
          texto[i] = texto[i] + texto[i+1]; //Concatena as duas strings
          texto.splice(i+1,1); //Tira a segunda string da lista
          texto[i] = texto[i].substr(1).slice(0, -1); //Remove as aspas
          break;
        } else {
          texto[i] = texto[i] + texto[i+1]; //Se não tiver aspas no final, não é a última tag, apenas concatena as strings
          texto.splice(i+1,1); //E remove a segunda da lista
        }
      }
    }
  }
  return texto; //Retorna lista com os headers
}
function cria_objeto(aluno,header){ //Função que transforma linha da entrada em objeto js
  const PNF = require('google-libphonenumber').PhoneNumberFormat; //Invoca biblioteca de telefone
  const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
  var name = /fullname/i, eid = /eid/i, num = /\d+/,classe = /class/i, sala = /sala \d+/i, correio = /email/i; //Regex uteis para buscar coisas nas strings e verificar se algo é um email
  var email = /\w+@\w+\.[a-z]+\.?[a-z]{0,2}/, telefone = /phone/i, invisivel = /invisible/i, ver = /see_all/i, letra = /[a-zA-Z]+/,especiais = /[();:!#$*&£\[\]\{\}+=]+/;
  var modelo, endereço; //Variáveis usadas
  modelo = {
    fullname : "",
    eid: "",
    classes : [],
    addresses: [],
    invisible: false,
    see_all: false
  } //Objeto com informações para os alunos
  aluno = separar(aluno);
  for (var i = 0; i < header.length; i++){
    endereço = {
      type: "",
      tags: [],
      address: ""
    } //Objeto para salvar os endereços, precisa ser recriado a cada iteração para não dar problema de referência
    if (aluno[i] === ""){
      continue;
    }
    if (name.test(header[i])){
      modelo.fullname = aluno[i];
    } else if (eid.test(header[i])){
      if(num.test(aluno[i])){
        modelo.eid = num.exec(aluno[i])[0];
      }
    } else if (classe.test(header[i])){
        modelo = adicionar(endereço,aluno[i],sala,modelo,1);
    } else if (correio.test(header[i])){
      if (especiais.test(aluno[i])){
        continue;
      }
      endereço.type = "email";
      var tags = header[i].split(" ");
      for (var j = 0; j < tags.length; j++){
        if (correio.test(tags[j])){
          continue;
        } else{
          if (!busca(tags[j],endereço.tags))
          endereço.tags.push(tags[j]);
        }
      }
      modelo = adicionar(endereço,aluno[i],email,modelo,2);
    } else if (telefone.test(header[i])){
      if ((letra.test(aluno[i]))){
        continue;
      }
      endereço.type = "phone";
      var tags = header[i].split(" ");
      for (var j = 0; j < tags.length; j++){
        if (telefone.test(tags[j])){
          continue;
        } else{
          if (!busca(tags[j],endereço.tags))
          endereço.tags.push(tags[j]);
        }
      }
      var number = phoneUtil.parseAndKeepRawInput(aluno[i], 'BR');
      if (phoneUtil.isValidNumber(number)){
        endereço.address = phoneUtil.format(number, PNF.E164).replace("+","");
        modelo.addresses = funde(modelo.addresses,endereço);
      }
    } else if (invisivel.test(header[i])){
      if ((aluno[i] == true || aluno[i] == "yes" || num.test(aluno[i])) && (aluno[i] != 0 && aluno[i] !== "false" && aluno[i] != "no" && aluno[i] != false)){
        modelo.invisible = true;
      }
    } else if (ver.test(header[i])){
      if ((aluno[i] == true || aluno[i] == "yes" || num.test(aluno[i])) && (aluno[i] != 0 && aluno[i] !== "false" && aluno[i] != "no" && aluno[i] != false)){
        modelo.see_all = true;
      }
    }
  }
  return modelo;
}
function adicionar(endereço,aluno,regex,modelo,tipo){
  var cópia;
  while (regex.test(aluno)){
    cópia = {
      type: endereço.type,
      tags: endereço.tags,
      address: ""
    }
    var corresponde = regex.exec(aluno)[0];
    if (tipo === 1){
      if (!busca(corresponde,modelo.classes)){
        modelo.classes.push(corresponde);
      }
    } else {
      cópia.address = corresponde;
      modelo.addresses = funde(modelo.addresses,cópia);
    }
    aluno = aluno.replace(corresponde,"");
  }
  return modelo;
}
function coloca(lista,aluno){
  var i ,j
  for (i = 0; i < lista.length; i++){
    if (lista[i].eid === aluno.eid){
      for (j = 0; j < aluno.classes.length; j++){
        if (!busca(aluno.classes[j],lista[i].classes)){
          if (!Array.isArray(lista[i].classes)){
            lista[i].classes = [lista[i].classes];
          }
          lista[i].classes.push(aluno.classes[j]);
        }
      }
      for (j = 0; j < aluno.addresses.length; j++){
        lista[i].addresses = funde(lista[i].addresses,aluno.addresses[j]);
      }
      if (lista[i].invisible === true || aluno.invisible === true){
        lista[i].invisible = true;
      }
      if (lista[i].see_all === true || aluno.see_all === true){
        lista[i].see_all = true;
      }
      return lista;
    }
  }
  lista.push(aluno);
  return lista;
}
function busca(elemento,lista){
  var i;
  if (lista === undefined || lista === null){
    lista = [];
  }
  for (i = 0; i < lista.length; i++){
    if (elemento == lista[i]){
      return true;
    }
  }
  return false;
}
function funde(lista,endereço){
  if (lista === undefined || lista === null){
    lista = [];
  }
  var x = busca_endereço(lista,endereço)
  if (lista.tags === undefined || lista.tags === null){
    lista.tags = [];
  }
  if (x < 0){
    lista.push(endereço);
    return lista;
  } else{
    for (var i = 0; i < endereço.tags.length; i++){
      if (!busca(endereço.tags[i],lista.tags)){
        lista[x].tags.push(endereço.tags[i]);
      }
    }
    return lista;
  }
}
function busca_endereço(lista,endereço){
  var i
  for (i = 0; i < lista.length; i++){
    if (endereço.address == lista[i].address){
      return i;
    }
  }
  return -1;
}


main()
//Agradeço a Deus porque Ele sempre está comigo, morreu por mim, me salvou e cuidou de mim em cada momento de minha vida.
