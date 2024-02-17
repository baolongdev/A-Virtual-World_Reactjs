import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea } from '@nextui-org/react'
import React, { useState } from 'react'

interface Props {
    isOpenOsm: boolean,
    onOpenChangeOsm,
    parseOseData
}

function OpenStreetMap(props: Props) {
    const { isOpenOsm, onOpenChangeOsm, parseOseData } = props
    const [description, setDescription] = useState('');


    return (
        <Modal
            isOpen={isOpenOsm}
            onOpenChange={onOpenChangeOsm}
            isDismissable={false}
            backdrop="blur"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Modal Title</ModalHeader>
                        <ModalBody>
                            <div className="w-full gap-4">
                                <Textarea
                                    key="underlined"
                                    variant="underlined"
                                    label="Description"
                                    labelPlacement="outside"
                                    placeholder="Enter your description"
                                    className=""
                                    value={description}
                                    onValueChange={setDescription}
                                />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Close
                            </Button>
                            <Button color="primary" onClick={() => parseOseData(description)}>
                                Action
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}

export default OpenStreetMap
