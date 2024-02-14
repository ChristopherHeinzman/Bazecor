export function padToN(number: string, numberToPad: number = 0) {
  let str = "";

  for (let i = 0; i < numberToPad; i++) str += "0";

  return (str + number).slice(-numberToPad);
}
