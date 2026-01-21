'use client'

import React from 'react'
import Image from 'next/image'

export default function Icon() {
  return (
    <Image
      src="/images/GameWorkerSolidarity_Logo_Transparent.png"
      width={32}
      height={32}
      alt="GWSP Icon"
      style={{ objectFit: 'contain' }}
    />
  )
}
