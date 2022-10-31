import CaviarColors from './caviar/color/color-semantics'
import CaviarTokens from './caviar/color/color-tokens'

import ConsumerColors from './default/color/color-semantics'
import ConsumerTokens from './default/color/color-tokens'

import MerchantColors from './merchant/color/color-semantics'

function groupByKey(array, key) {
  return array.reduce((hash, obj) => {
    if (obj[key] === undefined) return hash;
    return Object.assign(hash, {
      [obj[key]]: (hash[obj[key]] || []).concat(obj)
    });
  }, {});
}

const CaviarColorTokens = () => {
  const CaviarColorTokens: any = CaviarTokens
  const CaviarColors: any = {}
  const keys = Object.keys(CaviarTokens)

  keys.forEach(tokenName => {
    const keyName = tokenName.replace('SystemCaviar', '')
    CaviarColors[keyName] = CaviarColorTokens[tokenName]
  })
  return CaviarColors
}

const CodeThemeFiles = {
  'Merchant (Mx)': {
    ...ConsumerColors,
    ...ConsumerTokens,
    ...MerchantColors
  },
  'Caviar': {
    ...ConsumerColors,
    ...ConsumerTokens,
    ...CaviarColors,
    ...CaviarColorTokens
  },
  'Consumer (Cx)': { 
    ...ConsumerColors,
    ...ConsumerTokens
  }
}


Pulsar.registerFunction(
  "readableVariableName",
  function (token, tokenGroup) {
    // Create array with all path segments and token name at the end
    const segments = [...tokenGroup.path];
    if (!tokenGroup.isRoot) {
      segments.push(tokenGroup.name)
    }
    segments.push(token.name);

    let sentence = segments.join(" / ");

    return sentence;
  }
);


const auditTokenInfo = (brands) => {
  const brandAudit: any = [];

  brands.forEach((brand) => {
    const auditData: any = [];
    const otherBrands = brands.filter((br) => br.name !== brand.name);

    brand.tokens.forEach((tokenName) => {
      const messages: any = [];
      otherBrands.forEach((otherBrand) => {
        //check each brand's data for
        if (!otherBrand.tokens.includes(tokenName)) {
          messages.push(`Match not found in ${otherBrand.name}`);
        }
      });

      if (!messages.length) {
        messages.push("Healthy and Matched");
      }
      auditData.push({
        tokenName,
        messages,
      });
    });

    brandAudit.push({
      name: brand.name,
      tokens: auditData
    });
  });

  return brandAudit;
};

Pulsar.registerFunction("auditTokenInfo", auditTokenInfo);


/*
   brands: {
    name: ...
    tokens: {
      tokenName
      tokenValue
    }
   }

*/

/*
[{
  name: ...,
  tokens: [
    figmaName:
    codeName:
    figmaColor: ...,
    codeColor: ...,
    message: healthy, mismatch, check manually
  ]
}]
*/


const colorAudit = (brands) => {
  const colorAudit: any = [];
  

  brands.forEach((brand) => {
    const auditData: any = []
    const codeObject = CodeThemeFiles[brand.name]

    brand.tokens.forEach(token => {
      const codeName = token.tokenName.split(' / ').join('').split('.').join('')
      const figmaName = token.tokenName
      const figmaValue = "#" + token.tokenValue.hex.substring(0, 6).toLowerCase()
      const codeValue = codeObject[codeName]?.toLowerCase()
      let message = ''
      if(!codeValue) {
        message = 'Needs Manual Check'
      } else {
        message = figmaValue === codeValue ? 'Healthy' : 'Mismatch'
      }

      const tokenGroupName = token.tokenGroup[0]      

      auditData.push({ 
        figmaName,
        figmaValue,
        codeName,
        codeValue,
        message,
        tokenGroup: tokenGroupName
      })
      
    })
    
    const groupedTokens = groupByKey(auditData, 'tokenGroup')
    
    const groupKeys = Object.keys(groupedTokens)

    const groupData = groupKeys.map(key => {
      const tokens = groupedTokens[key]
      return {
        groupName: key,
        tokens
      }
    })

    colorAudit.push({
      name: brand.name,
      groups: groupData
    });

  });
    

  return colorAudit
}

Pulsar.registerFunction("colorAudit", colorAudit);


