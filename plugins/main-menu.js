import {
  promises,
  readFileSync
} from "fs"
import {
  join
} from "path"
import {
  xpRange
} from "../lib/levelling.js"
import moment from "moment-timezone"
import os from "os"
import fs from "fs"
import fetch from "node-fetch"

const defaultMenu = {
  before: `
 ╭━━━〔丂ㄒ卂尺〕━━━┈⊷
┃✰│𝗨𝘀𝗲𝗿: %name    
┃✰│𝗗𝗲𝘃:𝙴𝚇𝙲𝙴𝙻
┃✰│𝗠𝗼𝗱𝗲: %mode
┃✰│𝗣𝗹𝗮𝘁𝗳𝗼𝗿𝗺: %platform
┃✰│𝗧𝘆𝗽𝗲: 𝙽𝚘𝚍𝚎𝙹𝚜
┃✰│𝗕𝗮𝗶𝗹𝗲𝘆𝘀: 𝙼𝚞𝚕𝚝𝚒 𝙳𝚎𝚟𝚒𝚌𝚎
┃✰│𝗣𝗿𝗲𝗳𝗶𝘅: [ *%_p* ]
┃✰│𝗨𝗽𝘁𝗶𝗺𝗲: %muptime
┃✰│𝗗𝗮𝘁𝗮𝗯𝗮𝘀𝗲:  %totalreg
┃✰│𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: %totalfeatures 
┃✰│𝗗𝗮𝘆_𝗽𝗮𝗿𝘁: *%ucpn* 
┃✰╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
 *©ＳＴＡＲ-ＭＤ-Ｖ２*

  %readmore
 `.trimStart(),
  header: "┌─⬤『 ```%category``` 』⬤",
  body: "┃➺ %cmd %isPremium %islimit",
  footer: "╰─────────────────⬤",
  after: "\n%me",
}

let handler = async (m, {
  conn,
  usedPrefix: _p,
  __dirname,
  args
}) => {
  await conn.sendMessage(m.chat, {
    react: {
      text: "🥂",
      key: m.key,
    }
  })

  let tags = {}

  try {
    /* Info Menu */
    let glb = global.db.data.users
    let usrs = glb[m.sender]
    let tag = `@${m.sender.split("@")[0]}`
    let mode = process.env.MODE || (global.opts["self"] ? "Private" : "Public");
    let _package = JSON.parse(await promises.readFile(join(__dirname, "../package.json")).catch(_ => ({}))) || {}
    let {
      age,
      exp,
      limit,
      level,
      role,
      registered,
      credit
    } = glb[m.sender]
    let {
      min,
      xp,
      max
    } = xpRange(level, global.multiplier)
    let name = await conn.getName(m.sender)
    let premium = glb[m.sender].premiumTime
    let prems = `${premium > 0 ? "Premium" : "Free"}`
    let platform = os.platform()

    let ucpn = `${ucapan()}`

    let _uptime = process.uptime() * 1000
    let _muptime
    if (process.send) {
      process.send("uptime")
      _muptime = await new Promise(resolve => {
        process.once("message", resolve)
        setTimeout(resolve, 1000)
      }) * 1000
    }
    let muptime = clockString(_muptime)
    let uptime = clockString(_uptime)

    let totalfeatures = Object.values(global.plugins).filter((v) => v.help && v.tags).length;
    let totalreg = Object.keys(glb).length
    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
        help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: "customPrefix" in plugin,
        limit: plugin.limit,
        premium: plugin.premium,
        enabled: !plugin.disabled,
      }
    })
    for (let plugin of help)
      if (plugin && "tags" in plugin)
        for (let tag of plugin.tags)
          if (!(tag in tags) && tag) tags[tag] = tag
    conn.menu = conn.menu ? conn.menu : {}
    let before = conn.menu.before || defaultMenu.before
    let header = conn.menu.header || defaultMenu.header
    let body = conn.menu.body || defaultMenu.body
    let footer = conn.menu.footer || defaultMenu.footer
    let after = conn.menu.after || (conn.user.jid == global.conn.user.jid ? "" : `Powered by https://wa.me/${global.conn.user.jid.split`@`[0]}`) + defaultMenu.after
    let _text = [
      before,
      ...Object.keys(tags).map(tag => {
        return header.replace(/%category/g, tags[tag]) + "\n" + [
          ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
            return menu.help.map(help => {
              return body.replace(/%cmd/g, menu.prefix ? help : "%_p" + help)
                .replace(/%islimit/g, menu.limit ? "Ⓛ" : "")
                .replace(/%isPremium/g, menu.premium ? "🅟" : "")
                .trim()
            }).join("\n")
          }),
          footer
        ].join("\n")
      }),
      after
    ].join("\n")
    let text = typeof conn.menu == "string" ? conn.menu : typeof conn.menu == "object" ? _text : ""
    let replace = {
      "%": "%",
      p: _p,
      uptime,
      muptime,
      me: conn.getName(conn.user.jid),
      npmname: _package.name,
      npmdesc: _package.description,
      version: _package.version,
      exp: exp - min,
      maxexp: xp,
      totalexp: exp,
      xp4levelup: max - exp,
      github: _package.homepage ? _package.homepage.url || _package.homepage : "[unknown github url]",
      tag,
      ucpn,
      platform,
      mode,
      _p,
      credit,
      age,
      tag,
      name,
      prems,
      level,
      limit,
      name,
      totalreg,
      totalfeatures,
      role,
      readmore: readMore
    }
    text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, "g"), (_, name) => "" + replace[name])
    const pp = './Assets/STAR-V2.jpg'

    let contact = {
      key: {
        fromMe: false,
        participant: `${m.sender.split`@`[0]}@s.whatsapp.net`,
        ...(m.chat ? {
          remoteJid: '16504228206@s.whatsapp.net'
        } : {})
      },
      message: {
        contactMessage: {
          displayName: `${name}`,
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:${name}\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
        }
      }
    }

    // Adding buttons
    const buttons = [
      {buttonId: `${_p}command1`, buttonText: {displayText: 'Option 1'}, type: 1},
      {buttonId: `${_p}command2`, buttonText: {displayText: 'Option 2'}, type: 1},
      {buttonId: `${_p}command3`, buttonText: {displayText: 'Option 3'}, type: 1}
    ];

    const buttonMessage = {
      contentText: text.trim(),
      footerText: 'Choose an option:',
      buttons: buttons,
      headerType: 1
    };

    await conn.sendMessage(m.chat, buttonMessage, {quoted: contact});

  } catch (e) {
    await conn.reply(m.chat, "error", m)
    throw e
  }
}

handler.command = /^(menu|help|\?)$/i

export default handler

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

function clockString(ms) {
  let h = isNa