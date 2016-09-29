
# A photo taking machine
# uses a rotary stage and gphoto2 for taking pictures
# dependencies include serial, libgphoto2, libgphoto
# sudo apt-get install libgphoto2-dev libgphoto2-port10 gphoto2
# also https://pypi.python.org/pypi/gphoto2/1.3.3/
#
#
# set portname
# set location of hex file for bootloader
#
# Nadya Peek, peek@mit.edu
# spring 2016

#------IMPORTS-------
from pygestalt import nodes
from pygestalt import interfaces
from pygestalt import machines
from pygestalt import functions
from pygestalt.machines import elements
from pygestalt.machines import kinematics
from pygestalt.machines import state
from pygestalt.utilities import notice
from pygestalt.publish import rpc	#remote procedure call dispatcher
import time
import io
import sys
import json
import os
import logging
import subprocess


#------VIRTUAL MACHINE------
class virtualMachine(machines.virtualMachine):
	
	def initInterfaces(self):
		if self.providedInterface: self.fabnet = self.providedInterface		#providedInterface is defined in the virtualMachine class.
		else: self.fabnet = interfaces.gestaltInterface('FABNET', interfaces.serialInterface(baudRate = 115200, interfaceType = 'ftdi', portName = '/dev/tty.usbserial-FTXYJGOO'))
		
	def initControllers(self):
		self.aAxisNode = nodes.networkedGestaltNode('A Axis', self.fabnet, filename = '086-005a.py', persistence = self.persistence)
		self.aNode = nodes.compoundNode(self.aAxisNode)

	def initCoordinates(self):
		self.position = state.coordinate(['mm'])
	
	def initKinematics(self):
		self.aAxis = elements.elementChain.forward([elements.microstep.forward(4), elements.stepper.forward(1.8), elements.pulley.forward(36), elements.invert.forward(True)])
		
		self.stageKinematics = kinematics.direct(1)	#direct drive on all axes
	
	def initFunctions(self):
		self.move = functions.move(virtualMachine = self, virtualNode = self.aNode, axes = [self.aAxis], kinematics = self.stageKinematics, machinePosition = self.position,planner = 'null')
		self.jog = functions.jog(self.move)	#an incremental wrapper for the move function
		pass
		
	def initLast(self):
#		self.machineControl.setMotorCurrents(aCurrent = 0.8, bCurrent = 0.8, cCurrent = 0.8)
#		self.aNode.setVelocityRequest(0)	#clear velocity on nodes. Eventually this will be put in the motion planner on initialization to match state.
		pass
	
	def publish(self):
#		self.publisher.addNodes(self.machineControl)
		pass
	
	def getPosition(self):
		return {'position':self.position.future()}
	
	def setPosition(self, position  = [None]):
		self.position.future.set(position)

	def setSpindleSpeed(self, speedFraction):
#		self.machineControl.pwmRequest(speedFraction)
		pass

#------IF RUN DIRECTLY FROM TERMINAL------
if __name__ == '__main__':
	# The persistence file remembers the node you set. It'll generate the first time you run the
	# file. If you are hooking up a new node, delete the previous persistence file.
	stage = virtualMachine(persistenceFile = "virtualmachineids.vmp")

	# You can load a new program onto the nodes if you are so inclined. This is currently set to 
	# the path to the 086-005 repository on Nadya's machine. 
	#stages.xyzNode.loadProgram('../../../086-005/086-005a.hex')
	
	# This is a widget for setting the potentiometer to set the motor current limit on the nodes.
	# The A4982 has max 2A of current, running the widget will interactively help you set. 
	#stages.xyzNode.setMotorCurrent(0.7)

	# This is for how fast the motors move
	stage.aNode.setVelocityRequest(1)	
	
	# Pull the moves out of the provided file
	# Where coordinates are provided as
	# [[angle1],[angle2]]
	moves = []

	try: 
		movestr = sys.argv[1] # moves are passed as a string, this may break with very long strings
	except:
		print "No moves file provided"


	segs = json.loads(movestr)
	for move in segs:
		moves.append(move)
	#print "Moves:"
	#print moves

        #gphoto setup
	#logging.basicConfig(
	#	format='%(levelname)s: %(name)s: %(message)s', level=logging.WARNING)
	#gp.check_result(gp.use_python_logging())
	#context = gp.gp_context_new()
	#camera = gp.check_result(gp.gp_camera_new())
	#gp.check_result(gp.gp_camera_init(camera, context))


	for coords in moves:
		time.sleep(5)
		stage.move(coords, 0)
		print('Capturing image')
		#file_path = gp.check_result(gp.gp_camera_capture(
		#	camera, gp.GP_CAPTURE_IMAGE, context))
		#print('Camera file path: {0}/{1}'.format(file_path.folder, file_path.name))
		#target = os.path.join('/tmp', file_path.name)
		#print('Copying image to', target)
		#camera_file = gp.check_result(gp.gp_camera_file_get(
		#	camera, file_path.folder, file_path.name,
		#	gp.GP_FILE_TYPE_NORMAL, context))
		#gp.check_result(gp.gp_file_save(camera_file, target))
		#subprocess.call(['xdg-open', target])

		status = stage.aAxisNode.spinStatusRequest()
		while status['stepsRemaining'] > 0:
			time.sleep(0.001)
			status = stage.aAxisNode.spinStatusRequest()	
	
	#gp.check_result(gp.gp_camera_exit(camera, context))
