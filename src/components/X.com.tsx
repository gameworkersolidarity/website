const XOutlinedIcon = ({
  color = '#000000',
  strokeWidth = undefined,
  background = 'transparent',
  opacity = 1,
  rotation = 0,
  shadow = 0,
  flipHorizontal = false,
  flipVertical = false,
  padding = 0,
  className,
}: {
  size?: number
  color?: string
  strokeWidth?: number
  background?: string
  opacity?: number
  rotation?: number
  shadow?: number
  flipHorizontal?: boolean
  flipVertical?: boolean
  padding?: number
  className?: string
}) => {
  // const transforms = []
  // if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`)
  // if (flipHorizontal) transforms.push('scaleX(-1)')
  // if (flipVertical) transforms.push('scaleY(-1)')

  const viewBoxSize = 1000 + padding * 2
  const viewBoxOffset = -padding
  const viewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      // style={{
      //   opacity,
      //   transform: transforms.join(' ') || undefined,
      //   filter:
      //     shadow > 0 ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))` : undefined,
      //   backgroundColor: background !== 'transparent' ? background : undefined,
      // }}
      className={className}
    >
      <path
        fill="currentColor"
        fill-rule="evenodd"
        d="M921 912L601.11 445.745l.546.437L890.084 112h-96.385L558.738 384L372.15 112H119.367l298.648 435.31l-.036-.037L103 912h96.385l261.222-302.618L668.217 912zM333.96 184.727l448.827 654.546h-76.38l-449.19-654.546z"
      />
    </svg>
  )
}

export default XOutlinedIcon
