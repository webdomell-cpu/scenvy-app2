import React from 'react'

export function ScenvyModuleIcon({ name, size = 32, className = '', style = {} }) {
  const iconMap = {
    flow: '/scenvy_flow.svg',
    menu: '/scenvy_menu.svg',
    board: '/scenvy_board.svg',
    host: '/scenvy_host.svg',
    store: '/scenvy_store.svg',
    link: '/scenvy_link.svg',
    magic: '/scenvy_magic.svg'
  }

  const src = iconMap[name?.toLowerCase()] || iconMap.flow

  return (
    <img
      src={src}
      alt={`SCENVY ${name}`}
      width={size}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        borderRadius: size > 40 ? 12 : 8,
        objectFit: 'contain',
        flexShrink: 0,
        ...style
      }}
    />
  )
}

export function ScenvyFlowIcon({ size = 32, style = {} }) {
  return <ScenvyModuleIcon name="flow" size={size} style={style} />
}

export function ScenvyMenuIcon({ size = 32, style = {} }) {
  return <ScenvyModuleIcon name="menu" size={size} style={style} />
}

export function ScenvyBoardIcon({ size = 32, style = {} }) {
  return <ScenvyModuleIcon name="board" size={size} style={style} />
}

export function ScenvyHostIcon({ size = 32, style = {} }) {
  return <ScenvyModuleIcon name="host" size={size} style={style} />
}

export function ScenvyStoreIcon({ size = 32, style = {} }) {
  return <ScenvyModuleIcon name="store" size={size} style={style} />
}

export function ScenvyLinkIcon({ size = 32, style = {} }) {
  return <ScenvyModuleIcon name="link" size={size} style={style} />
}

export function ScenvyMagicIcon({ size = 32, style = {} }) {
  return <ScenvyModuleIcon name="magic" size={size} style={style} />
}
